let currentUser = null;
let isLoggedIn = false;

const PRICING = {
    pricePerOperatorPerDay: 25000
};

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];
    
    const serviceDateInput = document.getElementById('serviceDate');
    if (serviceDateInput) {
        serviceDateInput.min = minDate;
    }
    
    checkExistingSession();
    
    setupEventListeners();
}

function setupEventListeners() {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegistration);
    }
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

function showRegisterModal() {
    const modal = document.getElementById('registerModal');
    modal.style.display = 'block';
    document.getElementById('registerForm').reset();
    clearErrorMessages();
}

function showLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.style.display = 'block';
    document.getElementById('loginForm').reset();
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
}

function switchToRegister() {
    closeModal('loginModal');
    showRegisterModal();
}

function handleRegistration(event) {
    event.preventDefault();
    
    clearErrorMessages();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const clientSideUserData = {
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword'),
        idDocument: formData.get('idDocument')
    };

    if (!validateRegistrationData(clientSideUserData)) {
        return;
    }
    
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Registrando...';
    submitButton.disabled = true;

    fetch('http://localhost:3000/api/users/register', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        return response.json().then(data => ({
            status: response.status,
            data: data
        }));
    })
    .then(({ status, data }) => {
        if (status === 201) {
            closeModal('registerModal');
            showSuccessModal();
        } else {
            if (data.message) {
                if (data.message.includes('correo')) {
                    showFieldError('emailError', data.message);
                } else {
                    alert(`Error en el registro: ${data.message}`);
                }
            } else {
                alert('Ocurrió un error inesperado.');
            }
        }
    })
    .catch(error => {
        console.error('Error de red:', error);
        alert('No se pudo conectar con el servidor. Por favor, intenta de nuevo más tarde.');
    })
    .finally(() => {
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
    });
}

function validateRegistrationData(userData) {
    let isValid = true;
    
    if (!userData.fullName || userData.fullName.trim().length < 2) {
        showFieldError('fullNameError', 'El nombre debe tener al menos 2 caracteres');
        isValid = false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!userData.email || !emailRegex.test(userData.email)) {
        showFieldError('emailError', 'Ingresa un correo electrónico válido');
        isValid = false;
    }
    
    const phoneRegex = /^[0-9]{10}$/;
    if (!userData.phone || !phoneRegex.test(userData.phone.replace(/\s/g, ''))) {
        showFieldError('phoneError', 'Ingresa un número de teléfono válido (10 dígitos)');
        isValid = false;
    }
    
    if (!userData.password || userData.password.length < 6) {
        showFieldError('passwordError', 'La contraseña debe tener al menos 6 caracteres');
        isValid = false;
    }
    
    if (userData.password !== userData.confirmPassword) {
        showFieldError('confirmPasswordError', 'Las contraseñas no coinciden');
        isValid = false;
    }
    
    if (!userData.idDocument || userData.idDocument.size === 0) {
        showFieldError('idDocumentError', 'Debes subir tu documento de identidad en formato PDF');
        isValid = false;
    } else if (userData.idDocument.type !== 'application/pdf') {
        showFieldError('idDocumentError', 'El documento debe estar en formato PDF');
        isValid = false;
    }
    
    return isValid;
}

/*
function simulateRegistration(userData) {
    // Mostrar estado de carga
    const submitButton = document.querySelector('#registerForm button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Registrando...';
    submitButton.disabled = true;
    
    // Simular delay de red
    setTimeout(() => {
        // Guardar usuario en localStorage (simulación)
        const users = JSON.parse(localStorage.getItem('cleanusUsers') || '[]');
        
        // Verificar si el email ya existe
        if (users.find(user => user.email === userData.email)) {
            showFieldError('emailError', 'Este correo electrónico ya está registrado');
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            return;
        }
        
        // Agregar nuevo usuario
        const newUser = {
            id: Date.now(),
            fullName: userData.fullName,
            email: userData.email,
            phone: userData.phone,
            address: {
                street: userData.street,
                number: userData.number,
                city: userData.city,
                zipCode: userData.zipCode
            },
            password: userData.password, // En producción, esto debe ser hasheado
            registrationDate: new Date().toISOString()
        };
        
        users.push(newUser);
        localStorage.setItem('cleanusUsers', JSON.stringify(users));
        
        // Mostrar modal de éxito
        closeModal('registerModal');
        showSuccessModal();
        
        // Restaurar botón
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        
    }, 2000); // Simular 2 segundos de procesamiento
}
*/

function showSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.style.display = 'block';
}

function closeSuccessModal() {
    closeModal('successModal');
    showLoginModal();
}

function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        alert('Por favor, completa todos los campos.');
        return;
    }

    const submitButton = document.querySelector('#loginForm button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Iniciando sesión...';
    submitButton.disabled = true;

    fetch('http://localhost:3000/api/users/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            loginEmail: email,
            loginPassword: password
        })
    })
    .then(response => response.json().then(data => ({ status: response.status, data })))
    .then(({ status, data }) => {
        if (status === 200) {
            currentUser = data.user;
            isLoggedIn = true;
            
            localStorage.setItem('cleanusToken', data.token);
            localStorage.setItem('cleanusCurrentUser', JSON.stringify(data.user));
            
            closeModal('loginModal');
            showUserPortal();
        } else {
            alert(data.message || 'Error al iniciar sesión.');
        }
    })
    .catch(error => {
        console.error('Error de red:', error);
        alert('No se pudo conectar con el servidor.');
    })
    .finally(() => {
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
    });
}

/*
function simulateLogin(email, password) {
    const submitButton = document.querySelector('#loginForm button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Iniciando sesión...';
    submitButton.disabled = true;
    
    setTimeout(() => {
        // Buscar usuario en localStorage
        const users = JSON.parse(localStorage.getItem('cleanusUsers') || '[]');
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            // Login exitoso
            currentUser = user;
            isLoggedIn = true;
            
            // Guardar sesión
            localStorage.setItem('cleanusCurrentUser', JSON.stringify(user));
            
            // Cerrar modal y mostrar portal
            closeModal('loginModal');
            showUserPortal();
        } else {
            // Login fallido
            alert('Credenciales incorrectas. Verifica tu email y contraseña.');
        }
        
        // Restaurar botón
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        
    }, 1500);
}
*/

function checkExistingSession() {
    const savedUser = localStorage.getItem('cleanusCurrentUser');
    const token = localStorage.getItem('cleanusToken');

    if (savedUser && token) {
        currentUser = JSON.parse(savedUser);
        isLoggedIn = true;
        showUserPortal();
    }
}

function showUserPortal() {
    document.querySelector('nav').style.display = 'none';
    document.querySelector('.hero').style.display = 'none';
    document.querySelector('.benefits').style.display = 'none';
    document.querySelector('.about').style.display = 'none';
    
    const portal = document.getElementById('userPortal');
    portal.style.display = 'block';
    
    document.getElementById('userName').textContent = `Bienvenido, ${currentUser.fullName}`;

    fetchAndDisplayServices();
}

function logout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        currentUser = null;
        isLoggedIn = false;
        localStorage.removeItem('cleanusCurrentUser');
        localStorage.removeItem('cleanusToken');
        
        document.querySelector('nav').style.display = 'block';
        document.querySelector('.hero').style.display = 'flex';
        document.querySelector('.benefits').style.display = 'block';
        document.querySelector('.about').style.display = 'block';
        
        document.getElementById('userPortal').style.display = 'none';
        
        document.getElementById('serviceForm').reset();
        document.getElementById('orderSummary').style.display = 'none';
        document.getElementById('serviceHistoryList').innerHTML = '<p>No tienes servicios programados.</p>';
    }
}

function calculateTotal() {
    const serviceDate = document.getElementById('serviceDate').value;
    const operatorCount = parseInt(document.getElementById('operatorCount').value);
    const serviceDays = parseInt(document.getElementById('serviceDays').value);
    
    if (!serviceDate || !operatorCount || !serviceDays) {
        alert('Por favor, completa todos los campos para calcular el total');
        return;
    }
    
    const selectedDate = new Date(serviceDate);
    const today = new Date();
    if (selectedDate <= today) {
        alert('La fecha del servicio debe ser posterior a hoy');
        return;
    }
    
    const total = operatorCount * serviceDays * PRICING.pricePerOperatorPerDay;
    
    displayOrderSummary(serviceDate, operatorCount, serviceDays, total);
}

function displayOrderSummary(date, operators, days, total) {
    const formattedDate = new Date(date).toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    document.getElementById('orderDate').textContent = formattedDate;
    document.getElementById('orderOperators').textContent = `${operators} operario${operators > 1 ? 's' : ''}`;
    document.getElementById('orderDays').textContent = `${days} día${days > 1 ? 's' : ''}`;
    document.getElementById('orderTotal').textContent = formatCurrency(total);
    
    document.getElementById('orderSummary').style.display = 'block';
    
    document.getElementById('orderSummary').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

function processPayment() {
    if (confirm('¿Confirmas que deseas proceder con el pago de este servicio?')) {
        const payButton = document.querySelector('#orderSummary .btn-primary');
        const originalButtonText = payButton.textContent;
        payButton.textContent = 'Procesando...';
        payButton.disabled = true;

        const serviceData = {
            serviceDate: document.getElementById('serviceDate').value,
            operatorCount: document.getElementById('operatorCount').value,
            serviceDays: document.getElementById('serviceDays').value
        };

        const token = localStorage.getItem('cleanusToken');
        if (!token) {
            alert('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
            logout();
            return;
        }

        fetch('http://localhost:3000/api/services', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(serviceData)
        })
        .then(response => response.json().then(data => ({ status: response.status, data })))
        .then(({ status, data }) => {
            if (status === 201) {
                showConfirmationModal();
                
                document.getElementById('serviceForm').reset();
                document.getElementById('orderSummary').style.display = 'none';

                fetchAndDisplayServices();
            } else {
                alert(`Error: ${data.message || 'No se pudo registrar el servicio.'}`);
            }
        })
        .catch(error => {
            console.error('Error de red al solicitar servicio:', error);
            alert('No se pudo conectar con el servidor.');
        })
        .finally(() => {
            payButton.textContent = originalButtonText;
            payButton.disabled = false;
        });
    }
}

async function fetchAndDisplayServices() {
    const historyList = document.getElementById('serviceHistoryList');
    historyList.innerHTML = '<p>Cargando historial...</p>';

    const token = localStorage.getItem('cleanusToken');
    if (!token) {
        historyList.innerHTML = '<p>No se pudo autenticar. Por favor, inicia sesión de nuevo.</p>';
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/services', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            historyList.innerHTML = '<p>Tu sesión ha expirado. Inicia sesión de nuevo.</p>';
            logout();
            return;
        }

        const services = await response.json();

        if (services.length === 0) {
            historyList.innerHTML = '<p>No tienes servicios programados.</p>';
            return;
        }

        historyList.innerHTML = '';

        services.forEach(service => {
            const item = document.createElement('div');
            item.className = 'history-item';

            const serviceDate = new Date(service.service_date).toLocaleDateString('es-CO', {
                year: 'numeric', month: 'long', day: 'numeric'
            });

            item.innerHTML = `
                <div class="history-item-detail">
                    <strong>Fecha del Servicio</strong>
                    <span>${serviceDate}</span>
                </div>
                <div class="history-item-detail">
                    <strong>Operarios</strong>
                    <span>${service.operator_count}</span>
                </div>
                <div class="history-item-detail">
                    <strong>Días</strong>
                    <span>${service.service_days}</span>
                </div>
                <div class="history-item-detail">
                    <strong>Costo Total</strong>
                    <span>${formatCurrency(service.total_cost)}</span>
                </div>
                <div class="history-item-detail">
                    <strong>Estado</strong>
                    <span class="history-item-status ${service.status}">${service.status}</span>
                </div>
                <div class="history-item-actions">
                    <button class="btn-action btn-edit" onclick="editService('${service.id}', '${service.service_date.split('T')[0]}')">Editar Fecha</button>
                    <button class="btn-action btn-cancel" onclick="cancelService('${service.id}')">Cancelar</button>
                </div>
            `;
            historyList.appendChild(item);
        });

    } catch (error) {
        console.error('Error al obtener el historial de servicios:', error);
        historyList.innerHTML = '<p>Ocurrió un error al cargar tu historial. Intenta de nuevo más tarde.</p>';
    }
}

function editService(serviceId, currentServiceDate) {
    const newDate = prompt('Ingresa la nueva fecha para el servicio (YYYY-MM-DD):', currentServiceDate);

    if (newDate) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(newDate)) {
            alert('Formato de fecha inválido. Por favor, usa YYYY-MM-DD.');
            return;
        }

        const token = localStorage.getItem('cleanusToken');
        fetch(`http://localhost:3000/api/services/${serviceId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ serviceDate: newDate })
        })
        .then(response => response.json().then(data => ({ status: response.status, data })))
        .then(({ status, data }) => {
            if (status === 200) {
                alert('Servicio actualizado con éxito.');
                fetchAndDisplayServices();
            } else {
                alert(`Error: ${data.message}`);
            }
        })
        .catch(error => {
            console.error('Error al actualizar servicio:', error);
            alert('Error de conexión al actualizar el servicio.');
        });
    }
}

function cancelService(serviceId) {
    if (confirm('¿Estás seguro de que deseas cancelar este servicio? Esta acción no se puede deshacer.')) {
        const token = localStorage.getItem('cleanusToken');
        fetch(`http://localhost:3000/api/services/${serviceId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json().then(data => ({ status: response.status, data })))
        .then(({ status, data }) => {
            if (status === 200) {
                alert('Servicio cancelado con éxito.');
                fetchAndDisplayServices();
            } else {
                alert(`Error: ${data.message}`);
            }
        })
        .catch(error => {
            console.error('Error al cancelar servicio:', error);
            alert('Error de conexión al cancelar el servicio.');
        });
    }
}


function showConfirmationModal() {
    const modal = document.getElementById('confirmationModal');
    modal.style.display = 'block';
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
}

function showFieldError(errorElementId, message) {
    const errorElement = document.getElementById(errorElementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function clearErrorMessages() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
        element.textContent = '';
        element.style.display = 'none';
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
}

function validatePDFFile(file) {
    if (!file) return false;
    
    if (file.type !== 'application/pdf') {
        return false;
    }
    
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        showFieldError('idDocumentError', 'El archivo es demasiado grande. Máximo 5MB.');
        return false;
    }
    
    return true;
}

document.addEventListener('change', function(event) {
    if (event.target.id === 'idDocument') {
        const file = event.target.files[0];
        if (file && !validatePDFFile(file)) {
            event.target.value = '';
        }
    }
});

function validateEmailRealTime(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhoneRealTime(phone) {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

document.addEventListener('input', function(event) {
    const target = event.target;
    
    if (target.id === 'email') {
        const errorElement = document.getElementById('emailError');
        if (target.value && !validateEmailRealTime(target.value)) {
            showFieldError('emailError', 'Formato de email inválido');
        } else {
            errorElement.style.display = 'none';
        }
    }
    
    if (target.id === 'phone') {
        const errorElement = document.getElementById('phoneError');
        if (target.value && !validatePhoneRealTime(target.value)) {
            showFieldError('phoneError', 'Debe contener 10 dígitos');
        } else {
            errorElement.style.display = 'none';
        }
    }
    
    if (target.id === 'confirmPassword') {
        const password = document.getElementById('password').value;
        const errorElement = document.getElementById('confirmPasswordError');
        if (target.value && target.value !== password) {
            showFieldError('confirmPasswordError', 'Las contraseñas no coinciden');
        } else {
            errorElement.style.display = 'none';
        }
    }
});

document.addEventListener('click', function(event) {
    if (event.target.closest('.hamburger')) {
        const navMenu = document.querySelector('.nav-menu');
        navMenu.classList.toggle('active');
    }
});

document.addEventListener('click', function(event) {
    if (event.target.matches('.nav-menu a')) {
        const navMenu = document.querySelector('.nav-menu');
        navMenu.classList.remove('active');
    }
});

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    Object.assign(toast.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '5px',
        color: 'white',
        fontWeight: '500',
        zIndex: '9999',
        opacity: '0',
        transform: 'translateY(-20px)',
        transition: 'all 0.3s ease'
    });
    
    switch(type) {
        case 'success':
            toast.style.backgroundColor = '#28a745';
            break;
        case 'error':
            toast.style.backgroundColor = '#dc3545';
            break;
        case 'warning':
            toast.style.backgroundColor = '#ffc107';
            toast.style.color = '#212529';
            break;
        default:
            toast.style.backgroundColor = '#17a2b8';
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 100);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

window.showRegisterModal = showRegisterModal;
window.showLoginModal = showLoginModal;
window.closeModal = closeModal;
window.switchToRegister = switchToRegister;
window.closeSuccessModal = closeSuccessModal;
window.logout = logout;
window.calculateTotal = calculateTotal;
window.processPayment = processPayment;
window.scrollToSection = scrollToSection; 