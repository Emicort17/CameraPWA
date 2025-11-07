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

    // 1. Obtener las dimensiones REALES del video en pantalla
    const videoDisplayWidth = video.videoWidth;
    const videoDisplayHeight = video.videoHeight;
    
    // 2. Obtener las dimensiones del CONTENEDOR del video
    const containerWidth = video.offsetWidth;
    const containerHeight = video.offsetHeight;
    
    console.log(`Video real: ${videoDisplayWidth}x${videoDisplayHeight}`);
    console.log(`Contenedor: ${containerWidth}x${containerHeight}`);

    // 3. Calcular la relación de aspecto y escalar apropiadamente
    const scaleX = videoDisplayWidth / containerWidth;
    const scaleY = videoDisplayHeight / containerHeight;
    const scale = Math.min(scaleX, scaleY);
    
    // 4. Ajustar el canvas al tamaño de DISPLAY (no al nativo)
    canvas.width = containerWidth;
    canvas.height = containerHeight;
    
    // 5. Dibujar el video escalado al tamaño del contenedor
    ctx.drawImage(video, 0, 0, containerWidth, containerHeight);

    // 6. Conversión a Data URL
    const imageDataURL = canvas.toDataURL('image/jpeg', 0.8); // Usar JPEG para menor tamaño

    console.log('Foto capturada con dimensiones:', canvas.width, 'x', canvas.height);

    // 7. Añadir la foto a la galería
    addPhotoToGallery(imageDataURL);
}

function addPhotoToGallery(imageDataURL) {
    // Mostrar el contenedor de la galería si es la primera foto
    if (galleryContainer.style.display === 'none') {
        galleryContainer.style.display = 'block';
    }

    // Crear la miniatura
    const img = document.createElement('img');
    img.src = imageDataURL;
    img.classList.add('gallery-thumbnail');
    img.loading = 'lazy';

    // Añadir evento de clic para abrir el modal
    img.addEventListener('click', () => {
        openModal(imageDataURL);
    });

    // Añadir la imagen al contenedor deslizable
    galleryScroll.prepend(img);

    // Actualizar contador de fotos
    updatePhotoCount();

    // Mostrar notificación
    showNotification('¡Foto capturada! 📸');
}

function updatePhotoCount() {
    const count = galleryScroll.children.length;
    const countElement = document.querySelector('.gallery-count') || createCountElement();
    countElement.textContent = `${count} foto${count !== 1 ? 's' : ''}`;
}

function createCountElement() {
    const countElement = document.createElement('div');
    countElement.classList.add('gallery-count');
    document.querySelector('.gallery-header').appendChild(countElement);
    return countElement;
}

function showNotification(message) {
    // Crear notificación si no existe
    let notification = document.querySelector('.notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.classList.add('notification');
        document.body.appendChild(notification);
    }

    notification.textContent = message;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
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
