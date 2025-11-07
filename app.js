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
        // 1. Configuración mejorada para móvil
        const constraints = {
            video: {
                facingMode: { ideal: 'environment' },
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            },
            audio: false
        };

        // 2. Obtener el Stream de Medios
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // 3. Asignar el Stream al Elemento <video>
        video.srcObject = stream;
        
        // 4. [CORRECIÓN] Esperar a que el video pueda reproducirse
        video.onloadeddata = () => {
            // Ajustar el canvas al tamaño real del video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Ajustar también el contenedor para mantener proporciones
            video.style.width = '100%';
            video.style.height = 'auto';
            
            console.log(`Video dimensiones: ${video.videoWidth}x${video.videoHeight}`);
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

    // 4. ¡No cerramos la cámara!
    // closeCamera(); // Comentado para poder tomar varias fotos

    // 5. [NUEVO] Añadir la foto a la galería
    addPhotoToGallery(imageDataURL);
}

function addPhotoToGallery(imageDataURL) {
    // Mostrar el contenedor de la galería si es la primera foto
    if (galleryContainer.style.display === 'none') {
        galleryContainer.style.display = 'block';
    }

    // Crear la miniatura (el "bloque pequeño")
    const img = document.createElement('img');
    img.src = imageDataURL;
    img.classList.add('gallery-thumbnail');

    // [NUEVO] Añadir evento de clic para abrir el modal
    img.addEventListener('click', () => {
        openModal(imageDataURL);
    });

    // Añadir la imagen al contenedor deslizable
    // Usamos prepend para que la foto más nueva aparezca primero
    galleryScroll.prepend(img);
}

// --- Funciones del Modal ---

function openModal(imageDataURL) {
    modalImage.src = imageDataURL;
    modal.style.display = 'flex'; // Usamos flex (definido en CSS) para centrar
}

function closeModal() {
    modal.style.display = 'none';
    modalImage.src = ''; // Limpiar la imagen
}

// Event listeners
openCameraBtn.addEventListener('click', openCamera);
takePhotoBtn.addEventListener('click', takePhoto);

// Event listeners para cerrar el modal
modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
    // Cerrar si se hace clic fuera de la imagen (en el fondo oscuro)
    if (e.target === modal) {
        closeModal();
    }
});

// (Función closeCamera original, por si la necesitas en otro botón)
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
