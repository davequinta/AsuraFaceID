/*
 //Getting data from Collection
db.collection('afluencia').get().then((snapshot)=>{
  snapshot.docs.forEach(doc=>{
    console.log(doc.data().detecciones)
  })
})

//saving data

db.collection('afluencia').add({
  detecciones: 9,
  hora: "9am"
})

*/
var current_device=null
var findIP = new Promise(r=>{var w=window,a=new (w.RTCPeerConnection||w.mozRTCPeerConnection||w.webkitRTCPeerConnection)({iceServers:[]}),b=()=>{};a.createDataChannel("");a.createOffer(c=>a.setLocalDescription(c,b,b),b);a.onicecandidate=c=>{try{c.candidate.candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/g).forEach(r)}catch(e){}}})

/*Usage example*/

//console.log(findIP.then(ip => ip).catch(e => console.error(e)))

var current_name=""

const video = document.getElementById('video')
var labeledFaceDescriptors = null
var faceMatcher = null
var flag=false
var sw=false
var dave=false
var matus = false
var cesar = false
var richi = false


Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models')

]).then(loadImg).then(startVideo)


async function loadImg(){
  labeledFaceDescriptors = await loadLabeledImages()
  faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)
}

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    stream => video.srcObject = stream,
    err => console.error(err)
  )
}

video.addEventListener('play', () => {

  const canvas = faceapi.createCanvasFromMedia(video)
  document.body.append(canvas)
  const displaySize = { width: video.width, height: video.height }
  faceapi.matchDimensions(canvas, displaySize)
  setInterval(async () => {
    
//const labeledFaceDescriptors = await loadLabeledImages()
//const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors().withFaceExpressions()
    //console.log(detections)
    const resizedDetections = faceapi.resizeResults(detections, displaySize)
 
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)

    const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
    //console.log ("Adentro---->"+Object.keys(resizedDetections).length)

    results.forEach((result, i) => {
     
      const box = resizedDetections[i].detection.box



      current_name=getName(result.toString())
      


      /*
      if(getName(result.toString())=="Dave"){
        dave=true
      }else{
        dave=false
      }

      if(flag && dave ){
        dave=false
        console.log(getName(result.toString()))
      }

      */
      const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
      drawBox.draw(canvas,resizedDetections)
     // faceapi.draw.drawBox(canvas,  { label: result.toString() })

    })
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
    
   faceapi.draw.drawFaceExpressions(canvas, resizedDetections)


   //console.log ("Afuera---->"+Object.keys(resizedDetections).length)
   if(+Object.keys(resizedDetections).length==0){
    //console.log(resizedDetections[0].alignedRect.score)
    flag=true
    sw=false
  }else{
    flag=false
  }
 
  if(flag==false && !sw ){
    sw=true
    addDetection()    
  
  }

   //faceapi.draw.drawGender(canvas, resizedDetections)


   //faceapi.draw.drawTextField(canvas, resizedDetections)
  }, 500)
})

//var findIP = new Promise(r=>{var w=window,a=new (w.RTCPeerConnection||w.mozRTCPeerConnection||w.webkitRTCPeerConnection)({iceServers:[]}),b=()=>{};a.createDataChannel("");a.createOffer(c=>a.setLocalDescription(c,b,b),b);a.onicecandidate=c=>{try{c.candidate.candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/g).forEach(r)}catch(e){}}})
//findIP.then(ip => document.write(ip)).catch(e => console.error(e))


function addDetection(name){
  console.log(this.current_name)
  
  console.log("Nueva detección")
    var today = new Date();
    var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var dateTime = date+' '+time;

    findIP.then(function (value) {
      db.collection('detections').add({
        name: this.current_name,
        device: value,
        room: "Auditorio 07",
        date: dateTime
      })
    });
 

  this.flag=false

}


function getName(name){
    var nname= name.split(" ")
    return nname[0]

}

function loadLabeledImages() {
  const labels = ['Dave','Richi','Cesar','Matus','Luis']
  return Promise.all(
    labels.map(async label => {
      const descriptions = []
      for (let i = 1; i <= 3; i++) {
        const img = await faceapi.fetchImage(`https://raw.githubusercontent.com/davequinta/AsuraFaceID/master/Faces/${label}/${i}.JPG`)
        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
        console.log("Puntos: "+detections)
       // console.log("Descriptor"+detections.descriptor)
        descriptions.push(detections.descriptor)
      }

      console.log(descriptions)
      return new faceapi.LabeledFaceDescriptors(label, descriptions)
    })
  )
}
