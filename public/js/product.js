const container = document.getElementById('container');
const page = document.getElementById('page');
const backbtn = document.getElementById('backbtn');
const checkoutBtn = document.getElementById('checkoutBtn');
const addToCartBtn = document.getElementById('addToCartBtn');
const cartContainer = document.getElementById('cartContainer');
const searchInput = document.getElementById('searchInput');

let totalSum = 0;
let cart = {};

document.querySelectorAll('.item').forEach(div => {
  let quantity = 0;

  const incButton = div.querySelector('.incbtn');
  const decButton = div.querySelector('.decbtn');
  const countSpan = div.querySelector('.cont');

  const name = div.querySelector('.item-details strong').textContent;
  const priceText = div.querySelector('.item-details p').textContent;
  const price = Number(priceText.replace('Price: ', '').trim());
  const image = div.querySelector('img').src;

  incButton.addEventListener('click', async () => {
    quantity++;
    countSpan.textContent = quantity;

    cart[name] = {
      price,
      quantity,
      image
    };
    await syncCartToServer();
  });

  decButton.addEventListener('click', async () => {
    if (quantity > 0) {
      quantity--;
      countSpan.textContent = quantity;

      if (quantity === 0) {
        delete cart[name];
      } else {
        cart[name] = {
          price,
          quantity,
          image
        };
      }
      await syncCartToServer();
    }
  });
});

searchInput.addEventListener('input', function () {
  const query = this.value.toLowerCase();
  document.querySelectorAll('.item').forEach(div => {
    const name = div.querySelector('.item-details strong').textContent.toLowerCase();
    const country = div.querySelector('.item-details p:nth-child(3)').textContent.toLowerCase();

    const match = name.includes(query) || country.includes(query);
    div.style.display = match ? 'flex' : 'none';
  });
});

async function syncCartToServer() {
  try {
    await fetch('/api/update-cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cart })
    });
    console.log('🛒 Cart synced to server:', cart);
  } catch (error) {
    console.error('Failed to sync cart:', error);
  }
}

addToCartBtn.addEventListener('click', () => {
  backbtn.style.display = 'block';
  addToCartBtn.style.display = 'none';
  document.querySelector('.search-bar-container').style.display = 'none';
  container.style.display = 'none';
  page.style.display = 'block';

  cartContainer.innerHTML = '';
  const orderBlock = document.createElement('div');
  orderBlock.id = 'orderblock';

  let hasItems = false;
  totalSum = 0;

  for (let itemName in cart) {
    const item = cart[itemName];
    if (item.quantity > 0) {
      hasItems = true;
      totalSum += item.price * item.quantity;

      const order = document.createElement('div');
      order.classList.add('orderItem');

      order.innerHTML = `
        <img src="${item.image}" alt="${itemName}">
        <div>
          <strong>${itemName}</strong><br>
          Price: ${item.price}<br>
          Quantity: ${item.quantity}<br>
          Total: ${item.price * item.quantity}<br>
        </div>
      `;

      orderBlock.appendChild(order);
    }
  }

  if (hasItems) {
    const totalDiv = document.createElement('div');
    totalDiv.classList.add('totall');
    totalDiv.textContent = `Total amount: ${totalSum}`;
    orderBlock.appendChild(totalDiv);
    cartContainer.appendChild(orderBlock);
    checkoutBtn.style.display = 'block';
  } else {
    cartContainer.innerHTML = '<p>Your cart is empty</p>';
    checkoutBtn.style.display = 'none';
  }
});

backbtn.addEventListener('click', () => {
  container.style.display = 'flex';
  backbtn.style.display = 'none';
  page.style.display = 'none';
  addToCartBtn.style.display = 'block';
  document.querySelector('.search-bar-container').style.display = 'block';
  document.querySelector('.search-bar-container').style.display = 'flex'
});

checkoutBtn.addEventListener('click', () => {
  window.location.href = '/payment';
});

 const source = new EventSource('/events');
  source.onmessage = function (event) {
    if (event.data === 'refresh-products') {
      location.reload();
    }
  };
