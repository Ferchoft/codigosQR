const urlInput = document.getElementById('url');
const generarBtn = document.getElementById('generarBtn');
const qrcodeDiv = document.getElementById('qrcode');
const descargarBtn = document.getElementById('descargarBtn');
const compartirBtn = document.getElementById('compartirBtn');
const logoInput = document.getElementById('logo');

// Elementos del lector
const video = document.getElementById('video');
const resultElement = document.getElementById('result');
const startScanBtn = document.getElementById('startScanBtn');
const stopScanBtn = document.getElementById('stopScanBtn');

// Elementos de WhatsApp
const whatsappNumberInput = document.getElementById('whatsappNumber');
const generarWhatsappBtn = document.getElementById('generarWhatsappBtn');
const whatsappQrcodeDiv = document.getElementById('whatsappQrcode');
const descargarWhatsappBtn = document.getElementById('descargarWhatsappBtn');
const compartirWhatsappBtn = document.getElementById('compartirWhatsappBtn');

let qrcode;
let codeReader;
let isScanning = false;
let stream;
let currentQrDataURL;
let logoImage = null;
let whatsappQrCodeInstance;
let currentWhatsappQrDataURL;

logoInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            logoImage = new Image();
            logoImage.onload = () => {
                // El logo se ha cargado
            };
            logoImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        logoImage = null;
    }
});

function generateQRCode(targetDiv, downloadBtn, shareBtn, url, shouldApplyLogo = false) {
    downloadBtn.disabled = true;
    shareBtn.disabled = true;

    const qrSize = 200;
    const logoSize = 40;

    targetDiv.innerHTML = '';
    const qrCodeInstance = new QRCode(targetDiv, {
        text: url,
        width: qrSize,
        height: qrSize,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    const canvas = targetDiv.querySelector('canvas');
    let dataURL = null;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        dataURL = canvas.toDataURL('image/png');

        if (shouldApplyLogo && logoImage) {
            const x = (qrSize - logoSize) / 2;
            const y = (qrSize - logoSize) / 2;
            ctx.drawImage(logoImage, x, y, logoSize, logoSize);
            dataURL = canvas.toDataURL('image/png');
        }
    }

    setTimeout(() => {
        downloadBtn.disabled = false;
        shareBtn.disabled = false;
    }, 100);

    return dataURL;
}

generarBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();
    if (url) {
        currentQrDataURL = generateQRCode(qrcodeDiv, descargarBtn, compartirBtn, url, true);
    } else {
        alert('Por favor, introduce una URL.');
    }
});

descargarBtn.addEventListener('click', () => {
    if (currentQrDataURL) {
        const a = document.createElement('a');
        a.href = currentQrDataURL;
        a.download = 'qrcode_con_logo.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } else {
        alert('Primero debes generar un código QR.');
    }
});

compartirBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();
    if (url) {
        if (navigator.share) {
            navigator.share({
                title: 'Código QR Generado',
                text: 'He generado un código QR con la siguiente URL:',
                url: url,
            })
            .then(() => console.log('Compartido exitosamente'))
            .catch((error) => console.error('Error al compartir', error));
        } else {
            alert('La función de compartir no está disponible en este navegador. Puedes copiar la URL del código QR.');
        }
    } else {
        alert('Por favor, introduce una URL para compartir.');
    }
});

generarWhatsappBtn.addEventListener('click', () => {
    const phoneNumber = whatsappNumberInput.value.trim();
    if (phoneNumber) {
        const whatsappLink = `https://wa.me/${phoneNumber}`;
        currentWhatsappQrDataURL = generateQRCode(whatsappQrcodeDiv, descargarWhatsappBtn, compartirWhatsappBtn, whatsappLink, true);
    } else {
        alert('Por favor, introduce un número de teléfono para WhatsApp.');
    }
});

descargarWhatsappBtn.addEventListener('click', () => {
    if (currentWhatsappQrDataURL) {
        const a = document.createElement('a');
        a.href = currentWhatsappQrDataURL;
        a.download = 'whatsapp_qrcode_con_logo.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } else {
        alert('Primero debes generar un código QR de WhatsApp.');
    }
});

compartirWhatsappBtn.addEventListener('click', () => {
    const phoneNumber = whatsappNumberInput.value.trim();
    if (phoneNumber) {
        const whatsappLink = `https://wa.me/${phoneNumber}`;
        if (navigator.share) {
            navigator.share({
                title: 'Código QR de WhatsApp Generado',
                text: 'He generado un código QR para contactarme por WhatsApp:',
                url: whatsappLink,
            })
            .then(() => console.log('Compartido exitosamente'))
            .catch((error) => console.error('Error al compartir', error));
        } else {
            alert('La función de compartir no está disponible en este navegador. Puedes copiar el enlace de WhatsApp.');
        }
    } else {
        alert('Por favor, introduce un número de teléfono para WhatsApp para compartir.');
    }
});

// Lógica del lector de códigos QR
startScanBtn.addEventListener('click', async () => {
    if (!isScanning) {
        try {
            console.log('Intentando acceder a la cámara...');
            const constraints = { video: true }; // Intenta usar la cámara predeterminada en el ordenador
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('Stream de cámara obtenido:', stream);
            video.srcObject = stream;

            // Esperar a que el video esté cargado para evitar errores
            video.addEventListener('loadedmetadata', () => {
                console.log('Metadatos del video cargados.');
                codeReader = new ZXing.BrowserQRCodeReader();
                console.log('ZXing BrowserQRCodeReader inicializado:', codeReader);

                codeReader.decodeFromVideoStream(video, (result, error) => {
                    if (result) {
                        resultElement.textContent = `Código QR detectado: ${result.text}`;
                        stopScanning(); // Detener el escaneo al encontrar un código
                    }

                    if (error && !(error instanceof ZXing.NotFoundException)) {
                        console.error('Error de decodificación QR:', error);
                    }
                });
            });

            isScanning = true;
            startScanBtn.disabled = true;
            stopScanBtn.disabled = false;
            resultElement.textContent = 'Escaneando...';

        } catch (error) {
            console.error('Error AL ACCEDER a la cámara:', error.name, error.message); // Log del nombre y mensaje del error
            resultElement.textContent = 'Error al acceder a la cámara.';
        }
    }
});

stopScanBtn.addEventListener('click', () => {
    stopScanning();
});

function stopScanning() {
    if (isScanning) {
        console.log('Deteniendo el escaneo...');
        if (codeReader) {
            codeReader.reset();
            console.log('ZXing BrowserQRCodeReader reseteado.');
        }
        if (stream) {
            console.log('Stream existe, intentando detener...');
            stream.getTracks().forEach(track => {
                track.stop();
                console.log('Track de video detenido:', track.kind, track.label);
            });
            video.srcObject = null;
            console.log('Fuente de video limpiada.');
            stream = null; // Limpiar la variable stream
        } else {
            console.log('No hay stream para detener.');
        }
        isScanning = false;
        startScanBtn.disabled = false;
        stopScanBtn.disabled = true;
        resultElement.textContent = '';
        console.log('Escaneo detenido.');
    } else {
        console.log('El escaneo no estaba activo.');
    }
}
