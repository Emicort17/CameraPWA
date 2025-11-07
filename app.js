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
const switchCameraBtn = document.getElementById('switchCamera');
let currentFacingMode = 'environment'; // 'environment' = trasera, 'user' = frontal
let availableCameras = [];


let stream = null; // Variable para almacenar el MediaStream de la cámara

async function openCamera() {
    try {
        // 1. Primero enumerar las cámaras disponibles
        await enumerateCameras();
        
        // 2. Configuración inicial (cámara trasera por defecto)
        const constraints = {
            video: {
                facingMode: { ideal: 'environment' },
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            },
            audio: false
        };

        // 3. Obtener el Stream de Medios
        stream = await navigator.mediaDevices.getUserMedia(constraints);

        // 4. Asignar el Stream al Elemento <video>
        video.srcObject = stream;

        // 5. Configurar el video
        video.onloadeddata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Aplicar efecto espejo si es cámara frontal
            updateCameraStyle();
            
            console.log(`Cámara ${currentFacingMode === 'environment' ? 'trasera' : 'frontal'} activa`);
            console.log(`Dimensiones: ${video.videoWidth}x${video.videoHeight}`);
        };

        // 6. Actualización de la UI
        cameraContainer.style.display = 'block';
        openCameraBtn.textContent = 'Cámara Abierta';
        openCameraBtn.disabled = true;
        
        // Mostrar indicador de cámara activa
        showCameraIndicator();

    } catch (err) {
        console.error('Error al abrir la cámara: ', err);
        alert('No se pudo acceder a la cámara. Asegúrate de dar permisos.');
    }
}

// Función para enumerar cámaras disponibles
async function enumerateCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        availableCameras = devices.filter(device => device.kind === 'videoinput');
        
        console.log(`Cámaras disponibles: ${availableCameras.length}`);
        
        // Ocultar botón de cambiar cámara si solo hay una
        if (availableCameras.length <= 1) {
            switchCameraBtn.style.display = 'none';
        } else {
            switchCameraBtn.style.display = 'block';
        }
    } catch (err) {
        console.error('Error al enumerar cámaras:', err);
    }
}

// Función para cambiar entre cámaras
async function switchCamera() {
    if (!stream) {
        return;
    }

    try {
        // 1. Detener la cámara actual
        stream.getTracks().forEach(track => track.stop());
        
        // 2. Cambiar el modo de cámara
        currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
        
        // 3. Nuevas constraints
        const constraints = {
            video: {
                facingMode: { ideal: currentFacingMode },
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            },
            audio: false
        };

        // 4. Obtener nuevo stream
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        
        // 5. Actualizar estilo (efecto espejo para frontal)
        updateCameraStyle();
        
        // 6. Actualizar indicador
        showCameraIndicator();
        
        console.log(`Cambiado a cámara ${currentFacingMode === 'environment' ? 'trasera' : 'frontal'}`);
        
    } catch (err) {
        console.error('Error al cambiar cámara:', err);
        alert('No se pudo cambiar la cámara. Intenta de nuevo.');
    }
}

// Función para aplicar efecto espejo en cámara frontal
function updateCameraStyle() {
    if (currentFacingMode === 'user') {
        video.classList.add('mirror-mode');
    } else {
        video.classList.remove('mirror-mode');
    }
}

// Función para mostrar indicador de cámara activa
function showCameraIndicator() {
    // Remover indicador anterior si existe
    const existingIndicator = document.querySelector('.camera-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    const indicator = document.createElement('div');
    indicator.classList.add('camera-indicator');
    indicator.textContent = currentFacingMode === 'environment' ? ' Trasera' : ' Frontal';
    
    cameraContainer.appendChild(indicator);
}

function takePhoto() {
    if (!stream) {
        alert('Primero debes abrir la cámara');
        return;
    }

    // Usar un tamaño fijo balanceado
    const targetWidth = 800;
    const targetHeight = 600;
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    // Si es cámara frontal, necesitamos corregir el efecto espejo
    if (currentFacingMode === 'user') {
        ctx.save();
        ctx.scale(-1, 1); // Aplicar espejo horizontal
        ctx.drawImage(video, -targetWidth, 0, targetWidth, targetHeight);
        ctx.restore();
    } else {
        ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
    }

    const imageDataURL = canvas.toDataURL('image/jpeg', 0.8);

    console.log(`Foto capturada con cámara ${currentFacingMode === 'environment' ? 'trasera' : 'frontal'}`);
    addPhotoToGallery(imageDataURL);
}

switchCameraBtn.addEventListener('click', switchCamera);

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
