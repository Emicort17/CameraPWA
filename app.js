if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/CameraPWA/sw.js')
            .then(reg => console.log('Registro SW exitoso: ', reg))
            .catch(err => console.error('Error de registro SW: ', err));
    });
}


const openCameraBtn = document.getElementById('openCamera');
const cameraContainer = document.getElementById('cameraContainer');
const video = document.getElementById('video');
const takePhotoBtn = document.getElementById('takePhoto');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Nuevos elementos de la galería y modal
const galleryContainer = document.getElementById('galleryContainer');
const galleryScroll = document.getElementById('gallery-scroll');
const modal = document.getElementById('modal');
const modalImage = document.getElementById('modalImage');
const modalClose = document.getElementById('modalClose');


let stream = null; // Variable para almacenar el MediaStream de la cámara

async function openCamera() {
    try {
        // 1. Quitar restricciones fijas de tamaño
        // Pedimos la cámara trasera (environment)
        const constraints = {
            video: {
                facingMode: { ideal: 'environment' }
            },
            audio: false
        };

        // 2. Obtener el Stream de Medios
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // 3. Asignar el Stream al Elemento <video>
        video.srcObject = stream;
        
        // 4. [IMPORTANTE] Ajustar el canvas al tamaño real del video
        // Esperamos a que el video cargue sus metadatos
        video.onloadedmetadata = () => {
            // Ajustamos el tamaño del canvas para que coincida con el del video
            // Esto evita que la foto salga distorsionada
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            console.log(`Canvas ajustado a: ${canvas.width}x${canvas.height}`);
        };

        // 5. Actualización de la UI
        cameraContainer.style.display = 'block';
        openCameraBtn.textContent = 'Cámara Abierta';
        openCameraBtn.disabled = true;
        
        console.log('Cámara abierta');

    } catch (err) {
        console.error('Error al abrir la cámara: ', err);
        alert('No se pudo acceder a la cámara. Asegúrate de dar permisos.');
    }
}

function takePhoto() {
    if (!stream) {
        alert('Primero debes abrir la cámara');
        return;
    }

    // 1. Dibujar el Frame de Video en el Canvas
    // El canvas ya tiene el tamaño correcto gracias a 'onloadedmetadata'
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // 2. Conversión a Data URL
    const imageDataURL = canvas.toDataURL('image/png');
    
    // 3. (Opcional) Visualización y Depuración
    console.log('Foto capturada');


    addPhotoToGallery(imageDataURL);
}

function addPhotoToGallery(imageDataURL) {
    if (galleryContainer.style.display === 'none') {
        galleryContainer.style.display = 'block';
    }

    const img = document.createElement('img');
    img.src = imageDataURL;
    img.classList.add('gallery-thumbnail');


    img.addEventListener('click', () => {
        openModal(imageDataURL);
    });


    galleryScroll.prepend(img);
}

function openModal(imageDataURL) {
    modalImage.src = imageDataURL;
    modal.style.display = 'flex'; 
}

function closeModal() {
    modal.style.display = 'none';
    modalImage.src = ''; 
}

openCameraBtn.addEventListener('click', openCamera);
takePhotoBtn.addEventListener('click', takePhoto);

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

function closeCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
        video.srcObject = null;
        cameraContainer.style.display = 'none';
        openCameraBtn.textContent = 'Abrir Cámara';
        openCameraBtn.disabled = false;
        console.log('Cámara cerrada');
    }
}
