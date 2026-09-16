const API_URL = 'https://6aaa41d4ff4dd5698b4e3bfd.mockapi.io/tour';

function requestApi(url, options = {}) {
  return fetch(url, options).then(async response => {
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.message || `API error: ${response.status}`);
    }
    return data;
  });
}

class TourDuLich {
  constructor(data = {}) {
    this.tourID = data.id || data.tourID || null;
    this.tenTour = data.tenTour || data.name || '';
    this.moTa = data.moTa || data.description || '';
    this.ngayKhoiHanh = data.ngayKhoiHanh || data.startDate || '';
    this.ngayKetThuc = data.ngayKetThuc || data.endDate || '';
    this.giaTour = Number(data.giaTour || data.price) || 0;
    this.image = data.image || data.avatar || '';
  }

  Show() {
    const formattedPrice = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(this.giaTour);

    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('vi-VN');
    };

    const dateRange = `Từ ${formatDate(this.ngayKhoiHanh)} đến ${formatDate(this.ngayKetThuc)}`;
    
    const isLongText = this.moTa.length > 80;
    const shortDesc = isLongText ? this.moTa.substring(0, 80) + '...' : this.moTa;
    
    const descHTML = isLongText ? `
      <p class="tour-desc" id="desc-${this.tourID}">
        <span class="desc-text">${shortDesc}</span>
        <button class="btn-toggle-desc" onclick="toggleDescription('${this.tourID}', \`${encodeURIComponent(this.moTa)}\`)">Xem thêm</button>
      </p>
    ` : `<p class="tour-desc">${this.moTa}</p>`;

    return `
      <div class="tour-card" data-id="${this.tourID}">
        <img class="tour-img" src="${this.image}" alt="${this.tenTour}"
          onerror="this.onerror=null;this.src='https://picsum.photos/400/240'" />
        <div class="tour-info">
          <div class="tour-header">
            <span class="tour-id">Tour ID ${this.tourID}</span>
            <div class="card-admin-actions">
              <button class="btn-icon btn-edit" onclick="handleUpdate('${this.tourID}')" title="Sửa">✏️</button>
              <button class="btn-icon btn-delete" onclick="handleDelete('${this.tourID}')" title="Xóa">🗑️</button>
            </div>
          </div>
          <h3 class="tour-name">${this.tenTour}</h3>
          ${descHTML}
          <div class="tour-date">${dateRange}</div>
          <div class="tour-price">${formattedPrice}</div>
        </div>
        <button class="btn-book-full" onclick="handleBook('${this.tourID}')">Đặt Tour</button>
      </div>
    `;
  }

  async taoTour() {
    return requestApi(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenTour: this.tenTour,
        moTa: this.moTa,
        ngayKhoiHanh: this.ngayKhoiHanh,
        ngayKetThuc: this.ngayKetThuc,
        giaTour: this.giaTour,
        image: this.image
      })
    });
  }

  async capNhatTour() {
    if (!this.tourID) throw new Error('Tour ID không hợp lệ');
    return requestApi(`${API_URL}/${this.tourID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenTour: this.tenTour,
        moTa: this.moTa,
        ngayKhoiHanh: this.ngayKhoiHanh,
        ngayKetThuc: this.ngayKetThuc,
        giaTour: this.giaTour,
        image: this.image
      })
    });
  }

  async xoaTour() {
    if (!this.tourID) throw new Error('Tour ID không hợp lệ');
    return requestApi(`${API_URL}/${this.tourID}`, {
      method: 'DELETE'
    });
  }
}

let tourList = [];
const container = document.getElementById('tourContainer');
const tourForm = document.getElementById('tourForm');
const searchInput = document.getElementById('searchInput');

const editModal = document.getElementById('editModal');
const editTourForm = document.getElementById('editTourForm');
const confirmModal = document.getElementById('confirmModal');
const confirmTitle = document.getElementById('confirmTitle');
const confirmMessage = document.getElementById('confirmMessage');
const confirmCancelBtn = document.getElementById('confirmCancelBtn');
const confirmActionBtn = document.getElementById('confirmActionBtn');
let pendingConfirmation = null;
let lastFocusedElement = null;

function toInputDateFormat(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

async function fetchTours() {
  if (!container) return;
  try {
    const data = await requestApi(API_URL);
    tourList = data.map(item => new TourDuLich(item)).reverse();
    render();
  } catch (error) {
    console.error('Lỗi tải dữ liệu:', error);
    container.innerHTML = '<p class="empty-state">Không thể tải dữ liệu từ API. Kiểm tra lại URL MockAPI.</p>';
  }
}

function render(filteredList = null) {
  if (!container) return;
  const list = filteredList || tourList;
  if (list.length === 0) {
    container.innerHTML = '<p class="empty-state">Chưa có tour nào</p>';
    return;
  }
  container.innerHTML = list.map(tour => tour.Show()).join('');
}

function toggleDescription(id, encodedFullText) {
  const descElem = document.getElementById(`desc-${id}`);
  if (!descElem) return;

  const fullText = decodeURIComponent(encodedFullText);
  const isExpanded = descElem.classList.contains('expanded');

  if (isExpanded) {
    descElem.querySelector('.desc-text').innerText = fullText.substring(0, 80) + '...';
    descElem.querySelector('.btn-toggle-desc').innerText = 'Xem thêm';
    descElem.classList.remove('expanded');
  } else {
    descElem.querySelector('.desc-text').innerText = fullText + ' ';
    descElem.querySelector('.btn-toggle-desc').innerText = 'Thu gọn';
    descElem.classList.add('expanded');
  }
}

function handleSearch() {
  const keyword = searchInput.value.trim().toLowerCase();
  if (!keyword) {
    render();
    return;
  }
  const filtered = tourList.filter(t =>
    t.tenTour.toLowerCase().includes(keyword) ||
    t.moTa.toLowerCase().includes(keyword) ||
    String(t.tourID).includes(keyword)
  );
  render(filtered);
}

async function handleAdd(event) {
  event.preventDefault();
  const newTour = new TourDuLich({
    tenTour: document.getElementById('tenTour').value.trim(),
    image: document.getElementById('image').value.trim(),
    moTa: document.getElementById('moTa').value.trim(),
    ngayKhoiHanh: document.getElementById('ngayKhoiHanh').value,
    ngayKetThuc: document.getElementById('ngayKetThuc').value,
    giaTour: document.getElementById('giaTour').value
  });

  try {
    await newTour.taoTour();
    tourForm.reset();
    await fetchTours();
  } catch (error) {
    console.error('Lỗi khi tạo tour:', error);
    alert('Tạo tour thất bại!');
  }
}

function handleUpdate(id) {
  const tour = tourList.find(t => t.tourID == id);
  if (!tour) return;

  document.getElementById('editTourID').value = tour.tourID;
  document.getElementById('editTenTour').value = tour.tenTour;
  document.getElementById('editImage').value = tour.image;
  document.getElementById('editMoTa').value = tour.moTa;
  document.getElementById('editNgayKhoiHanh').value = toInputDateFormat(tour.ngayKhoiHanh);
  document.getElementById('editNgayKetThuc').value = toInputDateFormat(tour.ngayKetThuc);
  document.getElementById('editGiaTour').value = tour.giaTour;

  if (editModal) editModal.style.display = 'flex';
}

function closeEditModal() {
  if (editModal) editModal.style.display = 'none';
}

async function handleSaveUpdate(event) {
  event.preventDefault();
  const id = document.getElementById('editTourID').value;
  const tour = tourList.find(t => t.tourID == id);
  if (!tour) return;

  tour.tenTour = document.getElementById('editTenTour').value.trim();
  tour.image = document.getElementById('editImage').value.trim();
  tour.moTa = document.getElementById('editMoTa').value.trim();
  tour.ngayKhoiHanh = document.getElementById('editNgayKhoiHanh').value;
  tour.ngayKetThuc = document.getElementById('editNgayKetThuc').value;
  tour.giaTour = Number(document.getElementById('editGiaTour').value);

  try {
    await tour.capNhatTour();
    closeEditModal();
    await fetchTours();
  } catch (error) {
    console.error('Lỗi khi cập nhật tour:', error);
    alert('Cập nhật thất bại!');
  }
}

function openConfirmModal(type, id) {
  const tour = tourList.find(t => t.tourID == id);
  if (!tour || !confirmModal) return;

  pendingConfirmation = { type, id };
  lastFocusedElement = document.activeElement;
  confirmTitle.textContent = type === 'delete' ? 'Xóa tour?' : 'Xác nhận đặt tour';
  confirmMessage.textContent = type === 'delete'
    ? `Bạn có chắc muốn xóa tour "${tour.tenTour}" không?`
    : `Bạn muốn đặt tour "${tour.tenTour}" với giá ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tour.giaTour)}?`;
  confirmActionBtn.textContent = type === 'delete' ? 'Xóa tour' : 'Đặt tour';
  confirmActionBtn.classList.toggle('btn-danger', type === 'delete');
  confirmActionBtn.disabled = false;
  confirmActionBtn.onclick = confirmAction;
  confirmCancelBtn.hidden = false;
  confirmModal.style.display = 'flex';
  confirmActionBtn.focus();
}

function handleDelete(id) {
  openConfirmModal('delete', id);
}

function handleBook(id) {
  openConfirmModal('book', id);
}

function closeConfirmModal() {
  if (!confirmModal) return;
  confirmModal.style.display = 'none';
  pendingConfirmation = null;
  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    lastFocusedElement.focus();
  }
}

async function confirmAction() {
  if (!pendingConfirmation) return;

  const { type, id } = pendingConfirmation;
  const tour = tourList.find(t => t.tourID == id);
  if (!tour) {
    closeConfirmModal();
    return;
  }

  if (type === 'delete') {
    confirmActionBtn.disabled = true;
    confirmActionBtn.textContent = 'Đang xóa...';
    try {
      await tour.xoaTour();
      closeConfirmModal();
      await fetchTours();
    } catch (error) {
      console.error('Lỗi khi xóa tour:', error);
      confirmMessage.textContent = 'Không thể xóa tour. Vui lòng thử lại.';
      confirmActionBtn.disabled = false;
      confirmActionBtn.textContent = 'Xóa tour';
    }
    return;
  }

  pendingConfirmation = null;
  confirmTitle.textContent = 'Đặt tour thành công';
  confirmMessage.textContent = `Tour "${tour.tenTour}" đã được ghi nhận.`;
  confirmActionBtn.textContent = 'Đóng';
  confirmActionBtn.classList.remove('btn-danger');
  confirmCancelBtn.hidden = true;
  confirmActionBtn.onclick = closeConfirmModal;
}

if (tourForm) tourForm.addEventListener('submit', handleAdd);
if (editTourForm) editTourForm.addEventListener('submit', handleSaveUpdate);
if (searchInput) searchInput.addEventListener('input', handleSearch);

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && confirmModal?.style.display === 'flex') {
    closeConfirmModal();
  }
});

if (confirmModal) {
  confirmModal.addEventListener('click', event => {
    if (event.target === confirmModal) closeConfirmModal();
  });
}

document.addEventListener('DOMContentLoaded', fetchTours);