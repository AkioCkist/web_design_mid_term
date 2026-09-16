const API_URL = 'https://6aa98c582d442cb69d49e688.mockapi.io/product'; 

class Product {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || data.title || '';
    this.image = data.image || '';
    this.Description = data.Description || data.description || '';
    this.quantity = Number(data.quantity) || 0;
    this.Price = Number(data.price || data.Price) || 0;
  }
  Show() {
    const formattedPrice = new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(this.Price);

    return `
      <div class="product-card" data-id="${this.id}">
        <img class="main-img" src="${this.image}" alt="${this.name}" onerror="this.src='https://via.placeholder.com/300'" />
        <div class="info">
          <h3 class="title">${this.name}</h3>
          <p class="description">${this.Description}</p>
          <div class="price">${formattedPrice}</div>
          <div class="meta">
            <span>Số lượng: ${this.quantity}</span>
          </div>
          <div class="actions">
            <button onclick="handleUpdate('${this.id}')">Update</button>
            <button onclick="handleDelete('${this.id}')">Delete</button>
          </div>
        </div>
      </div>
    `;
  }

  async Add() {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: this.name,
        image: this.image,
        Description: this.Description,
        quantity: this.quantity,
        Price: this.Price
      })
    });
    return await response.json();
  }

  async Update() {
    if (!this.id) return;
    const response = await fetch(`${API_URL}/${this.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: this.name,
        image: this.image,
        Description: this.Description,
        quantity: this.quantity,
        Price: this.Price
      })
    });
    return await response.json();
  }

  async Delete() {
    if (!this.id) return;
    const response = await fetch(`${API_URL}/${this.id}`, {
      method: 'DELETE'
    });
    return await response.json();
  }
}

let productList = [];
const container = document.getElementById('productContainer');
const productForm = document.getElementById('productForm');
const modal = document.getElementById('productModal');
const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');

async function fetchProducts() {
  if (!container) return;

  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    
    productList = data.map(item => new Product(item)).reverse();
    render();
  } catch (error) {
    console.error("Lỗi tải dữ liệu:", error);
    container.innerHTML = "<p style='grid-column: 1/-1; text-align: center;'>Không thể tải dữ liệu từ API.</p>";
  }
}

function render() {
  if (!container) return;
  if (productList.length === 0) {
    container.innerHTML = '<p style="text-align:center; grid-column:1/-1; color: #94a3b8;">Chưa có sản phẩm nào</p>';
    return;
  }
  
  container.innerHTML = productList.map(product => product.Show()).join('');
}

function toggleModal(show = true) {
  if (show) {
    modal.classList.remove('hidden');
  } else {
    modal.classList.add('hidden');
    productForm.reset();
  }
}

if (openModalBtn) openModalBtn.addEventListener('click', () => toggleModal(true));
if (closeModalBtn) closeModalBtn.addEventListener('click', () => toggleModal(false));
if (cancelBtn) cancelBtn.addEventListener('click', () => toggleModal(false));

window.addEventListener('click', (e) => {
  if (e.target === modal) toggleModal(false);
});

// ===== HANDLERS (ADD, UPDATE, DELETE) =====
async function handleAdd(event) {
  event.preventDefault();

  const newProduct = new Product({
    name: document.getElementById('name').value.trim(),
    image: document.getElementById('image').value.trim(),
    Description: document.getElementById('description').value.trim(),
    quantity: document.getElementById('quantity').value,
    Price: document.getElementById('price').value
  });

  try {
    await newProduct.Add();
    toggleModal(false);
    fetchProducts();
  } catch (error) {
    console.error("Lỗi khi thêm sản phẩm:", error);
    alert("Thêm sản phẩm thất bại!");
  }
}

async function handleUpdate(id) {
  const product = productList.find(p => p.id === id);
  if (!product) return;

  const newName = prompt("Nhập tên mới cho sản phẩm:", product.name);
  if (newName && newName.trim() !== '') {
    product.name = newName.trim();
    await product.Update();
    fetchProducts();
  }
}

async function handleDelete(id) {
  const product = productList.find(p => p.id === id);
  if (product && confirm(`Xác nhận xóa sản phẩm "${product.name}"?`)) {
    await product.Delete();
    fetchProducts();
  }
}

// Event Listeners
if (productForm) productForm.addEventListener('submit', handleAdd);
document.addEventListener('DOMContentLoaded', fetchProducts);