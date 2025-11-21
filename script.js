// ==================== //
// Theme Management
// ==================== //
const themeToggle = document.getElementById('theme-toggle');
const html = document.documentElement;
const themeIcon = themeToggle.querySelector('i');

// Load saved theme
const savedTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

themeToggle.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
});

function updateThemeIcon(theme) {
    if (theme === 'dark') {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    } else {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    }
}

// ==================== //
// Aspect Ratio Lock
// ==================== //
let isConstraintActive = false;
let aspectRatio = 1;

function toggleConstraint() {
    const btn = document.getElementById('constraint-btn');
    const icon = btn.querySelector('i');
    
    isConstraintActive = !isConstraintActive;
    
    if (isConstraintActive) {
        // Calculate and store current aspect ratio
        const width = parseInt(document.getElementById('width-input').value);
        const height = parseInt(document.getElementById('height-input').value);
        aspectRatio = width / height;
        
        // Update button appearance
        btn.classList.add('active');
        icon.classList.remove('fa-link-slash');
        icon.classList.add('fa-link');
        
        showNotification('Aspect ratio locked', 'info');
    } else {
        // Update button appearance
        btn.classList.remove('active');
        icon.classList.remove('fa-link');
        icon.classList.add('fa-link-slash');
        
        showNotification('Aspect ratio unlocked', 'info');
    }
}

// ==================== //
// SVG Handling
// ==================== //
let currentSVG = null;

// Scale input handler
const scaleInput = document.getElementById('scale-input');
const scaleValue = document.getElementById('scale-value');

scaleInput.addEventListener('input', (e) => {
    scaleValue.textContent = e.target.value + 'x';
});

function displaySVG() {
    const svgInput = document.getElementById('svg-input').value.trim();
    const outputContainer = document.getElementById('svg-output-container');
    const downloadBtn = document.getElementById('download-btn');
    const statusBadge = document.getElementById('status-badge');
    
    if (!svgInput) {
        showNotification('Please enter SVG code', 'error');
        return;
    }
    
    try {
        // Clear previous content
        outputContainer.innerHTML = '';
        
        // Create temporary div to parse SVG
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = svgInput;
        const svgElement = tempDiv.querySelector('svg');
        
        if (!svgElement) {
            throw new Error('No valid SVG element found');
        }
        
        // Store current SVG
        currentSVG = svgElement.cloneNode(true);
        
        // Get dimensions from SVG or use defaults
        const viewBox = svgElement.getAttribute('viewBox');
        let width, height;
        
        if (viewBox) {
            const viewBoxValues = viewBox.split(' ');
            width = parseFloat(viewBoxValues[2]);
            height = parseFloat(viewBoxValues[3]);
        } else {
            width = parseFloat(svgElement.getAttribute('width')) || 300;
            height = parseFloat(svgElement.getAttribute('height')) || 300;
        }
        
        // Update aspect ratio
        aspectRatio = width / height;
        
        // Update dimension inputs
        document.getElementById('width-input').value = Math.round(width);
        document.getElementById('height-input').value = Math.round(height);
        
        // Set SVG dimensions
        svgElement.setAttribute('width', width);
        svgElement.setAttribute('height', height);
        
        // Display SVG
        outputContainer.appendChild(svgElement);
        
        // Enable download button
        downloadBtn.disabled = false;
        
        // Update status
        statusBadge.textContent = 'SVG Loaded';
        statusBadge.classList.add('success');
        
        showNotification('SVG rendered successfully!', 'success');
        
    } catch (error) {
        showNotification('Invalid SVG code: ' + error.message, 'error');
        outputContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Invalid SVG code</p>
            </div>
        `;
        downloadBtn.disabled = true;
        statusBadge.textContent = 'Error';
        statusBadge.classList.remove('success');
    }
}

function resizeSVG(changedDimension) {
    const outputContainer = document.getElementById('svg-output-container');
    const svgElement = outputContainer.querySelector('svg');
    
    if (!svgElement) return;
    
    const widthInput = document.getElementById('width-input');
    const heightInput = document.getElementById('height-input');
    
    let width = parseInt(widthInput.value);
    let height = parseInt(heightInput.value);
    
    // Apply constraint if active
    if (isConstraintActive && aspectRatio) {
        if (changedDimension === 'width') {
            // Width changed, adjust height
            height = Math.round(width / aspectRatio);
            heightInput.value = height;
        } else if (changedDimension === 'height') {
            // Height changed, adjust width
            width = Math.round(height * aspectRatio);
            widthInput.value = width;
        }
    }
    
    if (width > 0 && height > 0) {
        svgElement.setAttribute('width', width);
        svgElement.setAttribute('height', height);
    }
}

function downloadPNG() {
    const outputContainer = document.getElementById('svg-output-container');
    const svgElement = outputContainer.querySelector('svg');
    
    if (!svgElement) {
        showNotification('No SVG to convert', 'error');
        return;
    }
    
    const width = parseInt(document.getElementById('width-input').value);
    const height = parseInt(document.getElementById('height-input').value);
    const scale = parseInt(document.getElementById('scale-input').value);
    
    // Create canvas
    const canvas = document.getElementById('conversion-canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size with scale
    canvas.width = width * scale;
    canvas.height = height * scale;
    
    // Create SVG blob
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    // Create image
    const img = new Image();
    
    img.onload = function() {
        // Clear canvas (transparent background)
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw SVG image on transparent background
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Convert to PNG and download
        canvas.toBlob(function(blob) {
            const pngUrl = URL.createObjectURL(blob);
            const downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = `svg-converted-${width}x${height}-${Date.now()}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // Cleanup
            URL.revokeObjectURL(pngUrl);
            URL.revokeObjectURL(url);
            
            showNotification('Transparent PNG downloaded successfully!', 'success');
        }, 'image/png');
    };
    
    img.onerror = function() {
        showNotification('Error converting SVG to PNG', 'error');
        URL.revokeObjectURL(url);
    };
    
    img.src = url;
}

function clearAll() {
    document.getElementById('svg-input').value = '';
    document.getElementById('svg-output-container').innerHTML = `
        <div class="empty-state">
            <i class="fas fa-image"></i>
            <p>Your SVG will appear here</p>
        </div>
    `;
    document.getElementById('download-btn').disabled = true;
    document.getElementById('status-badge').textContent = 'No SVG loaded';
    document.getElementById('status-badge').classList.remove('success');
    currentSVG = null;
    
    // Reset constraint if active
    if (isConstraintActive) {
        toggleConstraint();
    }
    
    showNotification('Cleared successfully', 'info');
}

// ==================== //
// Notification System
// ==================== //
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 
                 'fa-info-circle';
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==================== //
// Keyboard Shortcuts
// ==================== //
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to render
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        displaySVG();
    }
    
    // Ctrl/Cmd + D to download
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (!document.getElementById('download-btn').disabled) {
            downloadPNG();
        }
    }
    
    // Ctrl/Cmd + L to toggle constraint
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        toggleConstraint();
    }
});

// ==================== //
// Initialize
// ==================== //
console.log('🎨 SVG to PNG Converter initialized!');
console.log('⌨️ Keyboard shortcuts:');
console.log('  • Ctrl/Cmd + Enter: Render SVG');
console.log('  • Ctrl/Cmd + D: Download PNG');
console.log('  • Ctrl/Cmd + L: Lock/Unlock aspect ratio');