const video = document.getElementById('video')
var labeledFaceDescriptors = null
var faceMatcher = null
var flag=true

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
    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box
      //console.log(result.toString())

      if(flag){
        console.log(getName(result.toString()))
      }
      const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() })
      drawBox.draw(canvas,resizedDetections)
     // faceapi.draw.drawBox(canvas,  { label: result.toString() })

    })
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
    
   faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
   //faceapi.draw.drawGender(canvas, resizedDetections)


   //faceapi.draw.drawTextField(canvas, resizedDetections)
  }, 100)
})


function getName(name){
    var nname= name.split(" ")
    return nname[0]

}

function loadLabeledImages() {
  const labels = ['Dave','Richi','Cesar','Matus','Luis','KeanuReeves']
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
