import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.8.0'

// Reference the HTML elements that we will need
const status = document.getElementById('status');
const imageContainer = document.getElementById('image-container');
const imageUpload = document.getElementById('imageUpload');

// Create a new object detection pipeline
status.textContent = 'Loading model...';
const detector = await pipeline('object-detection', 'Xenova/yolos-tiny');
status.textContent = 'Model loaded. Upload an image to detect objects.';

// Event listener for file input
imageUpload.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file && file.type.match('image.*')) {
        detectAndDrawObjects(file);
    }
});

async function detectAndDrawObjects(file) {
    // Get the image URL
    const imageURL = URL.createObjectURL(file);

    // Display the uploaded image
    const imgElement = document.createElement('img');
    imgElement.src = imageURL;
    imgElement.style.maxWidth = '100%';
    imgElement.style.height = 'auto';
    imageContainer.innerHTML = ''; // Clear previous images
    imageContainer.appendChild(imgElement);

    // Update status
    status.textContent = 'Detecting objects...';

    // Wait for the image to load
    await new Promise((resolve) => {
        imgElement.onload = resolve;
    });

    try {
        // Detect objects using the image URL
        const detectedObjects = await detector(imageURL, {
            threshold: 0.95,
            percentage: true
        });

        // Process detected objects
        detectedObjects.forEach(drawObjectBox);

        // Update status
        status.textContent = 'Object detection complete.';

    } catch (error) {
        console.error('Error in object detection:', error);
        status.textContent = 'Error in object detection. See console for details.';
    }

    // Revoke the object URL to free memory
    URL.revokeObjectURL(imageURL);
}

// Helper function that draws boxes for every detected object in the image
function drawObjectBox(detectedObject) {
    const { label, score, box } = detectedObject
    const { xmax, xmin, ymax, ymin } = box

    // Generate a random color for the box
    const color = '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, 0)

    // Draw the box
    const boxElement = document.createElement('div')
    boxElement.className = 'bounding-box'
    Object.assign(boxElement.style, {
        borderColor: color,
        left: 100 * xmin + '%',
        top: 100 * ymin + '%',
        width: 100 * (xmax - xmin) + '%',
        height: 100 * (ymax - ymin) + '%',
    })

    // Draw label
    const labelElement = document.createElement('span')
    labelElement.textContent = `${label}: ${Math.floor(score * 100)}%`
    labelElement.className = 'bounding-box-label'
    labelElement.style.backgroundColor = color

    boxElement.appendChild(labelElement)
    imageContainer.appendChild(boxElement)
}
