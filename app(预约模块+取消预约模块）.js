let currentUser = null;

function showPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    const page = document.getElementById(pageName + 'Page');
    if (page) page.classList.remove('hidden');
    
    if (pageName === 'home') updateWelcomeTitle();
    if (pageName === 'booking') initBookingPage();
    if (pageName === 'records') loadRecords();
    if (pageName === 'myAppointments') loadMyAppointments();
}

function updateWelcomeTitle() {
    const title = document.getElementById('welcomeTitle');
    if (title) {
        title.textContent = currentUser 
            ? `${currentUser.real_name || currentUser.username}，欢迎您使用医院挂号系统`
            : '欢迎使用医院挂号系统';
    }
}

function updateNav() {
    const nav = document.getElementById('navBar');
    if (!nav) return;
    
    if (currentUser) {
        nav.innerHTML = `
            <a href="#home" onclick="showPage('home')">首页</a>
            <a href="#booking" onclick="showPage('booking')">预约挂号</a>
            <a href="#records" onclick="showPage('records')">就诊记录</a>
            <a href="#myAppointments" onclick="showPage('myAppointments')">取消预约</a>
            <a href="#logout" onclick="logout(); return false;">退出</a>
        `;
    } else {
        nav.innerHTML = `
            <a href="#home" onclick="showPage('home')">首页</a>
            <a href="#login" onclick="showPage('login')">登录</a>
            <a href="#register" onclick="showPage('register')">注册</a>
        `;
    }
}

function showAlert(containerId, message, type = 'success') {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => { container.innerHTML = ''; }, 3000);
}

async function logout() {
    await api.auth.logout();
    currentUser = null;
    updateNav();
    showPage('home');
}

async function initBookingPage() {
    const result = await api.departments.list();
    if (result.success) {
        const select = document.getElementById('deptSelect');
        select.innerHTML = '<option value="">请选择科室</option>' + 
            result.data.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    }
    
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('bookingDate');
    if (dateInput) {
        dateInput.value = today;
        dateInput.min = today;
    }
}

async function loadDoctorsForBooking() {
    const deptId = document.getElementById('deptSelect').value;
    if (!deptId) return;
    
    const result = await api.doctors.list({ department_id: deptId });
    const select = document.getElementById('doctorSelect');
    if (result.success && select) {
        select.innerHTML = '<option value="">请选择医生</option>' + 
            result.data.map(d => `<option value="${d.id}">${d.real_name} - ${d.title || '医生'}</option>`).join('');
    }
}

async function loadTimePeriods() {
    const doctorId = document.getElementById('doctorSelect').value;
    const date = document.getElementById('bookingDate').value;
    if (!doctorId || !date) return;
    
    const result = await api.schedules.list({ doctor_id: doctorId, date: date });
    const select = document.getElementById('timePeriodSelect');
    if (result.success && select) {
        if (result.data.length === 0) {
            select.innerHTML = '<option value="">暂无可预约时段</option>';
            return;
        }
        select.innerHTML = '<option value="">请选择时段</option>' + 
            result.data.map(s => `<option value="${s.time_period}">${s.time_period} (剩余${s.remaining_slots}个)</option>`).join('');
    }
}

async function loadRecords() {
    const result = await api.appointments.list();
    const tbody = document.getElementById('recordsTable');
    if (result.success && tbody) {
        if (result.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">暂无记录</td></tr>';
            return;
        }
        tbody.innerHTML = result.data.map(a => `
            <tr>
                <td>${a.order_no || '-'}</td>
                <td>${a.patient_name || '-'}</td>
                <td>${a.department_name || '-'}</td>
                <td>${a.doctor_name || '-'}</td>
                <td>${a.appointment_date || '-'}</td>
                <td>${a.time_period || '-'}</td>
                <td><span class="status-badge status-${a.status}">${a.status === 'confirmed' ? '已预约' : '已取消'}</span></td>
            </tr>
        `).join('');
    }
}

async function loadMyAppointments() {
    if (!currentUser) {
        const tbody = document.getElementById('myAppointmentsTable');
        if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">请登录后查看</td></tr>';
        return;
    }
    
    const result = await api.appointments.my();
    const tbody = document.getElementById('myAppointmentsTable');
    if (result.success && tbody) {
        if (result.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">暂无预约记录</td></tr>';
            return;
        }
        tbody.innerHTML = result.data.map(a => `
            <tr>
                <td>${a.order_no || '-'}</td>
                <td>${a.department_name || '-'}</td>
                <td>${a.doctor_name || '-'}</td>
                <td>${a.appointment_date || '-'}</td>
                <td>${a.time_period || '-'}</td>
                <td><span class="status-badge status-${a.status}">${a.status === 'confirmed' ? '已预约' : '已取消'}</span></td>
                <td>
                    ${a.status === 'confirmed' ? `<button class="btn btn-danger btn-sm" onclick="cancelAppointment(${a.id})">取消</button>` : '-'}
                </td>
            </tr>
        `).join('');
    }
}

async function cancelAppointment(id) {
    if (!confirm('确定要取消该预约吗？')) return;
    const result = await api.appointments.cancel(id);
    if (result.success) {
        showAlert('myAppointmentsAlert', '取消成功');
        loadMyAppointments();
    } else {
        showAlert('myAppointmentsAlert', result.message, 'error');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const result = await api.auth.currentUser();
    if (result.success) currentUser = result.data;
    updateNav();
    updateWelcomeTitle();

    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const result = await api.auth.login({
            username: formData.get('username'),
            password: formData.get('password'),
        });
        if (result.success) {
            currentUser = result.data;
            updateNav();
            showAlert('loginAlert', '登录成功！');
            setTimeout(() => showPage('home'), 1000);
        } else {
            showAlert('loginAlert', result.message, 'error');
        }
    });

    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const result = await api.auth.register({
            username: formData.get('username'),
            password: formData.get('password'),
            real_name: formData.get('real_name'),
            id_card: formData.get('id_card'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            role: 'patient',
        });
        if (result.success) {
            showAlert('registerAlert', '注册成功！请登录');
            setTimeout(() => showPage('login'), 1500);
        } else {
            showAlert('registerAlert', result.message, 'error');
        }
    });

    document.getElementById('bookingForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const result = await api.appointments.create({
            doctor_id: formData.get('doctor_id'),
            appointment_date: formData.get('appointment_date'),
            time_period: formData.get('time_period'),
        });
        if (result.success) {
            showAlert('bookingAlert', `预约成功！订单号：${result.data.order_no}`);
            setTimeout(() => showPage('home'), 2000);
        } else {
            showAlert('bookingAlert', result.message, 'error');
        }
    });

    document.getElementById('bookingDate')?.addEventListener('change', loadTimePeriods);
    document.getElementById('doctorSelect')?.addEventListener('change', loadTimePeriods);
});