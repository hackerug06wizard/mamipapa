// Cart State
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// YOUR WhatsApp Number
const WHATSAPP_NUMBER = '256783468608';

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    updateCartUI();
    console.log('Bespoke Baby Store Loaded - Pixel ID: 2621239424886813');
});

// Toggle Mobile Navigation - FIXED
function toggleNav() {
    const navLinks = document.getElementById('navLinks');
    const navToggle = document.getElementById('navToggle');
    
    navLinks.classList.toggle('active');
    navToggle.classList.toggle('active');
    
    // Prevent body scroll when menu is open
    if (navLinks.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

// Open Cart
function openCart() {
    const modal = document.getElementById('cartModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    updateCartUI();
    
    // Track cart view
    if (typeof fbq !== 'undefined') {
        fbq('trackCustom', 'ViewCart', {
            item_count: getItemCount(),
            cart_value: getTotal()
        });
    }
}

// Close Cart
function closeCart() {
    const modal = document.getElementById('cartModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Close when clicking outside
function closeCartOutside(event) {
    if (event.target.id === 'cartModal') {
        closeCart();
    }
}

// Add to Cart
function addToCart(id, name, price, image) {
    const existingItem = cart.find(item => item.id === id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: id,
            name: name,
            price: price,
            image: image,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartUI();
    showNotification(name + ' added to cart!');
    
    // Meta Pixel - AddToCart
    if (typeof fbq !== 'undefined') {
        fbq('track', 'AddToCart', {
            content_ids: [id.toString()],
            content_name: name,
            content_type: 'product',
            value: price,
            currency: 'UGX'
        });
    }
}

// Update Quantity
function updateQuantity(id, change) {
    const item = cart.find(item => item.id === id);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity < 1) {
        removeFromCart(id);
        return;
    }
    
    saveCart();
    updateCartUI();
}

// Remove from Cart
function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartUI();
    showNotification('Item removed');
}

// Get Total
function getTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// Get Item Count
function getItemCount() {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
}

// Update UI
function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    // Update badge
    if (cartCount) {
        cartCount.textContent = getItemCount();
    }
    
    // Update items
    if (cartItems) {
        if (cart.length === 0) {
            cartItems.innerHTML = '<p class="empty-cart">Your cart is empty 🛒</p>';
        } else {
            cartItems.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="cart-item-details">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">UGX ${item.price.toLocaleString()}</div>
                        <div class="quantity-control">
                            <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
                            <span class="qty-value">${item.quantity}</span>
                            <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                        </div>
                    </div>
                    <button class="remove-btn" onclick="removeFromCart(${item.id})">Remove</button>
                </div>
            `).join('');
        }
    }
    
    // Update total
    if (cartTotal) {
        cartTotal.textContent = 'UGX ' + getTotal().toLocaleString();
    }
}

// Save to localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// WhatsApp Checkout - WITH CUSTOM CONVERSION FOR FACEBOOK ADS
function checkoutWhatsApp() {
    if (cart.length === 0) {
        showNotification('Cart is empty!');
        return;
    }
    
    // ============================================
    // FACEBOOK CUSTOM CONVERSION - CHECKOUT INITIATED
    // This is what you'll be charged for in Facebook Ads
    // ============================================
    if (typeof fbq !== 'undefined') {
        // Standard InitiateCheckout event
        fbq('track', 'InitiateCheckout', {
            content_ids: cart.map(item => item.id.toString()),
            content_type: 'product',
            value: getTotal(),
            currency: 'UGX',
            num_items: getItemCount()
        });
        
        // Custom conversion for WhatsApp specifically
        fbq('trackCustom', 'WhatsAppCheckoutClick', {
            cart_value: getTotal(),
            item_count: getItemCount(),
            products: cart.map(item => item.name).join(', '),
            whatsapp_number: WHATSAPP_NUMBER
        });
    }
    
    // Build WhatsApp message
    let message = '🛒 *Bespoke Baby Store Order*\n\n';
    message += '*Items:*\n';
    
    cart.forEach((item, index) => {
        message += `${index + 1}. ${item.name}\n`;
        message += `   Qty: ${item.quantity} × UGX ${item.price.toLocaleString()}\n`;
        message += `   = UGX ${(item.quantity * item.price).toLocaleString()}\n\n`;
    });
    
    message += `*Total: UGX ${getTotal().toLocaleString()}*\n\n`;
    message += 'Please confirm my order. Thank you!';
    
    // Open WhatsApp
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    
    showNotification('Opening WhatsApp...');
}

// Track WhatsApp click on contact page
function trackWhatsAppClick() {
    if (typeof fbq !== 'undefined') {
        fbq('trackCustom', 'ContactWhatsAppClick', {
            location: 'contact_page'
        });
    }
}

// Notification
function showNotification(message) {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.textContent = message;
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.remove();
    }, 3000);
}
