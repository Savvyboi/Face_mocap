const videoElement = document.getElementById('webcam');
const outputCanvas = document.getElementById('outputCanvas');
const canvasCtx = outputCanvas.getContext('2d');

const recordButton = document.getElementById('record-button');
const stopButton = document.getElementById('stop-button');
const exportButton = document.getElementById('export-button');

let faceMesh;
let mocapData = [];
let isRecording = false;

// Initialize MediaPipe FaceMesh with options
function initializeFaceMesh() {
	faceMesh = new FaceMesh({
		locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
	});

	faceMesh.setOptions({
		maxNumFaces: 1,
		refineLandmarks: true,
		minDetectionConfidence: 0.5,
		minTrackingConfidence: 0.5
	});

	faceMesh.onResults(onResults);

	// Start the video feed
	startWebcam();
}

// Start webcam function
function startWebcam() {
	navigator.mediaDevices.getUserMedia({ video: true })
		.then((stream) => {
			videoElement.srcObject = stream;
			videoElement.play();
			startFaceMeshDetection();
		})
		.catch((err) => console.error('Error accessing webcam:', err));
}

// Run face landmark detection on each frame
function onResults(results) {
	// Clear the canvas for each frame
	canvasCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);

	// If face landmarks are detected, draw them on the canvas
	if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
		results.multiFaceLandmarks.forEach((landmarks) => {
			// Draw each landmark point as a small red circle
			canvasCtx.fillStyle = "red";
			canvasCtx.lineWidth = 1;

			for (const landmark of landmarks) {
				const x = landmark.x * outputCanvas.width;
				const y = landmark.y * outputCanvas.height;

				// Draw a small circle at each landmark point
				canvasCtx.beginPath();
				canvasCtx.arc(x, y, 2, 0, 2 * Math.PI);
				canvasCtx.fill();
			}

			// Store mocap data if recording
			if (isRecording) {
				mocapData.push(landmarks);
			}
		});
	}
}

// Toggle recording state
function toggleRecording() {
	isRecording = !isRecording;
	recordButton.disabled = isRecording;
	stopButton.disabled = !isRecording;
	exportButton.disabled = !isRecording;
}

// Record button handler
recordButton.addEventListener('click', () => {
	toggleRecording();
	mocapData = []; // Clear previous data
});

// Stop button handler
stopButton.addEventListener('click', () => {
	toggleRecording();
});

// Export button handler
exportButton.addEventListener('click', () => {
	const dataStr = JSON.stringify(mocapData);
	const blob = new Blob([dataStr], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'mocap_data.json';
	a.click();
	URL.revokeObjectURL(url);
});

// Continuously process the video frames, calling detect on every frame
function startFaceMeshDetection() {
	async function detect() {
		await faceMesh.send({ image: videoElement });
		requestAnimationFrame(detect);  // Continuously call detect on every frame
	}
	detect();
}

// Initialize face mesh
initializeFaceMesh();
