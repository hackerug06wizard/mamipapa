// Shopping Cart State
let cart = [];

// WhatsApp Business Number - Replace with your number
const WHATSAPP_NUMBER = '256783468608'; // Format: country code + number without +

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Load cart from localStorage
    loadCart();
    
    // Setup mobile navigation
    setupMobileNav();
    
    // Setup cart modal
    setupCartModal();
    
    console.log('Bespoke Baby Store loaded');
});

// Mobile Navigation Setup - FIXED
function setupMobileNav() {
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            this.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
        
        // Close menu when clicking a link
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
                navToggle.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    }
}

// Cart Modal Setup
function setupCartModal() {
    const navCart = document.getElementById('navCart');
    
    if (navCart) {
        navCart.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openCart();
        });
    }
}

// Meta Pixel Tracking Functions
function trackCustomEvent(eventName, parameters = {}) {
    if (typeof fbq !== 'undefined') {
        fbq('trackCustom', eventName, parameters);
        console.log(`Tracked: ${eventName}`, parameters);
    }
}

function trackStandardEvent(eventName, parameters = {}) {
    if (typeof fbq !== 'undefined') {
        fbq('track', eventName, parameters);
        console.log(`Tracked Standard: ${eventName}`, parameters);
    }
}

// Format UGX Currency
function formatUGX(amount) {
    return 'UGX ' + amount.toLocaleString('en-UG');
}

// Add to Cart Function
function addToCart(id, name, price, image) {
    // Check if item already exists in cart
    const existingItem = cart.find(item => item.id === id);
    
    if (existingItem) {
        // Increase quantity if already in cart
        existingItem.quantity += 1;
        existingItem.subtotal = existingItem.quantity * existingItem.price;
    } else {
        // Add new item
        cart.push({
            id: id,
            name: name,
            price: price,
            image: image,
            quantity: 1,
            subtotal: price
        });
    }
    
    // Save to localStorage
    saveCart();
    
    // Update UI
    updateCartUI();
    
    // Track with Meta Pixel
    trackStandardEvent('AddToCart', {
        content_ids: [id.toString()],
        content_name: name,
        value: price,
        currency: 'UGX',
        content_type: 'product',
        quantity: 1
    });
    
    trackCustomEvent('AddToCartCustom', {
        product_id: id,
        product_name: name,
        product_price: price,
        cart_item_count: getTotalItems(),
        cart_total: getCartTotal()
    });
    
    showNotification(`${name} added to cart!`);
}

// Update Quantity
function updateQuantity(id, change) {
    const item = cart.find(item => item.id === id);
    if (!item) return;
    
    const newQuantity = item.quantity + change;
    
    if (newQuantity < 1) {
        // Remove item if quantity goes below 1
        removeFromCart(id);
        return;
    }
    
    item.quantity = newQuantity;
    item.subtotal = item.quantity * item.price;
    
    saveCart();
    updateCartUI();
    
    trackCustomEvent('CartQuantityChanged', {
        product_id: id,
        product_name: item.name,
        new_quantity: newQuantity,
        cart_total: getCartTotal()
    });
}

// Remove from Cart
function removeFromCart(id) {
    const itemIndex = cart.findIndex(item => item.id === id);
    if (itemIndex > -1) {
        const item = cart[itemIndex];
        cart.splice(itemIndex, 1);
        
        saveCart();
        updateCartUI();
        
        trackCustomEvent('RemoveFromCart', {
            product_id: id,
            product_name: item.name,
            cart_total: getCartTotal()
        });
        
        showNotification('Item removed from cart');
    }
}

// Get total items in cart
function getTotalItems() {
    return cart.reduce((total, item) => total + item.quantity, 0);
}

// Get cart total
function getCartTotal() {
    return cart.reduce((total, item) => total + item.subtotal, 0);
}

// Update Cart UI
function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotalEl = document.getElementById('cartTotal');
    
    const totalItems = getTotalItems();
    const total = getCartTotal();
    
    // Update badge
    if (cartCount) {
        cartCount.textContent = totalItems;
        // Add bounce animation
        cartCount.style.transform = 'scale(1.3)';
        setTimeout(() => {
            cartCount.style.transform = 'scale(1)';
        }, 200);
    }
    
    // Update modal content
    if (cartItems) {
        if (cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <div class="empty-cart-icon">🛒</div>
                    <p>Your cart is empty</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">Add some products!</p>
                </div>
            `;
        } else {
            cartItems.innerHTML = cart.map((item) => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">${formatUGX(item.price)} each</div>
                        <div class="quantity-control">
                            <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
                            <span class="qty-value">${item.quantity}</span>
                            <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                        </div>
                        <div class="cart-item-subtotal">Subtotal: ${formatUGX(item.subtotal)}</div>
                    </div>
                    <button class="cart-item-remove" onclick="removeFromCart(${item.id})">Remove</button>
                </div>
            `).join('');
        }
    }
    
    // Update total
    if (cartTotalEl) {
        cartTotalEl.textContent = formatUGX(total);
    }
}

// Open Cart Modal
function openCart() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        trackCustomEvent('CartViewed', {
            item_count: getTotalItems(),
            cart_value: getCartTotal(),
            unique_items: cart.length
        });
    }
}

// Close Cart Modal
function closeCart() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// WhatsApp Checkout
function checkoutWhatsApp() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!');
        return;
    }
    
    // Track checkout initiation
    trackStandardEvent('InitiateCheckout', {
        value: getCartTotal(),
        currency: 'UGX',
        num_items: getTotalItems()
    });
    
    // Build WhatsApp message
    let message = '🛒 *New Order from Bespoke Baby Store*\n\n';
    message += '*Order Details:*\n';
    message += '━━━━━━━━━━━━━━━━━━━━\n\n';
    
    cart.forEach((item, index) => {
        message += `*${index + 1}. ${item.name}*\n`;
        message += `   Quantity: ${item.quantity}\n`;
        message += `   Price: ${formatUGX(item.price)}\n`;
        message += `   Subtotal: ${formatUGX(item.subtotal)}\n\n`;
    });
    
    message += '━━━━━━━━━━━━━━━━━━━━\n';
    message += `*Total Items:* ${getTotalItems()}\n`;
    message += `*Total Amount:* ${formatUGX(getCartTotal())}\n\n`;
    message += 'Please confirm availability and payment details. Thank you! 🙏';
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Create WhatsApp URL
    const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    
    // Track WhatsApp click
    trackCustomEvent('WhatsAppCheckout', {
        cart_total: getCartTotal(),
        item_count: getTotalItems(),
        unique_items: cart.length
    });
    
    // Open WhatsApp
    window.open(whatsappURL, '_blank');
    
    showNotification('Opening WhatsApp...');
}

// Save Cart to localStorage
function saveCart() {
    localStorage.setItem('bbs_cart', JSON.stringify(cart));
}

// Load Cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('bbs_cart');
    
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
    
    updateCartUI();
}

// Contact Form Submit
function handleContactSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    trackCustomEvent('ContactFormSubmitted', {
        subject: data.subject,
        has_phone: !!data.phone
    });
    
    trackStandardEvent('Contact', {
        content_name: 'Contact Form'
    });
    
    showNotification('Thank you! We will get back to you soon.');
    event.target.reset();
}

// Notification System
function showNotification(message) {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Track Page Scroll Depth
let scrollTracked = { 25: false, 50: false, 75: false, 100: false };

window.addEventListener('scroll', () => {
    const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    
    if (scrollPercent >= 25 && !scrollTracked[25]) {
        trackCustomEvent('ScrollDepth', { depth: '25%' });
        scrollTracked[25] = true;
    }
    if (scrollPercent >= 50 && !scrollTracked[50]) {
        trackCustomEvent('ScrollDepth', { depth: '50%' });
        scrollTracked[50] = true;
    }
    if (scrollPercent >= 75 && !scrollTracked[75]) {
        trackCustomEvent('ScrollDepth', { depth: '75%' });
        scrollTracked[75] = true;
    }
    if (scrollPercent >= 100 && !scrollTracked[100]) {
        trackCustomEvent('ScrollDepth', { depth: '100%' });
        scrollTracked[100] = true;
    }
});

// Track Time on Page
let timeOnPage = 0;
setInterval(() => {
    timeOnPage += 10;
    if (timeOnPage === 30) {
        trackCustomEvent('EngagementTime', { duration: '30_seconds' });
    }
    if (timeOnPage === 60) {
        trackCustomEvent('EngagementTime', { duration: '1_minute' });
    }
}, 10000);

// Track initial page view
trackCustomEvent('PageViewDetailed', {
    page_type: window.location.pathname === '/' || window.location.pathname.includes('index') ? 'homepage' : 'internal',
    page_path: window.location.pathname,
    timestamp: new Date().toISOString()
});
    
