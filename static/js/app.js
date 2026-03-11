const themeToggle = document.getElementById('themeToggle');
const body = document.body;

themeToggle.addEventListener('click', () => {
    body.classList.toggle('light-theme');
    const isLight = body.classList.contains('light-theme');
    themeToggle.innerHTML = isLight ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
});

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    const color = type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--accent)';

    toast.innerHTML = `<i class="fa-solid ${icon}" style="color: ${color}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

async function fetchAlumni() {
    try {
        const res = await fetch('/api/alumni');
        const data = await res.json();
        renderTable(data);
    } catch (e) {
        showToast('Gagal memuat data alumni', 'error');
    }
}

function renderTable(data) {
    const tbody = document.getElementById('alumniTbody');
    const filter = document.getElementById('statusFilter').value;

    tbody.innerHTML = '';

    const filteredData = filter === 'all' ? data : data.filter(a => a.status.includes(filter) || (filter === 'Perlu Verifikasi Manual' && a.status === 'Perlu Verifikasi Manual'));

    filteredData.forEach(alumni => {
        const tr = document.createElement('tr');

        let statusClass = 'status-untracked';
        if (alumni.status === 'Kemungkinan Kuat') statusClass = 'status-identified';
        if (alumni.status === 'Perlu Verifikasi Manual') statusClass = 'status-verify';
        if (alumni.status === 'Tidak Cocok' || alumni.status === 'Belum Ditemukan') statusClass = 'status-notfound';

        tr.innerHTML = `
            <td>
                <div style="font-weight: 500">${alumni.name}</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary)">${alumni.program || '-'} (${alumni.year_in || '-'} - ${alumni.year_out || '-'})</div>
            </td>
            <td>
                <div><strong style="color: var(--accent);">${alumni.singkatan_kampus || '-'}</strong></div>
                <div style="font-size: 0.8rem; color: var(--text-secondary)">${alumni.nama_kampus || '-'}</div>
            </td>
            <td><span class="status-badge ${statusClass}">${alumni.status}</span></td>
            <td>
                <label class="switch">
                  <input type="checkbox" onchange="toggleOptOut(${alumni.id}, this.checked)" ${alumni.opt_out ? 'checked' : ''}>
                  <span class="slider"></span>
                </label>
            </td>
            <td style="min-width: 220px;">
                <div style="display: flex; width: 100%; justify-content: space-between; align-items: center; gap: 0.5rem;">
                    <div style="display: flex; gap: 0.5rem; align-items: center; min-height: 32px;">
                        ${!alumni.opt_out ? `<button class="btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;" onclick="triggerTracking(${alumni.id})"><i class="fa-solid fa-search"></i> Lacak</button>
                        <button class="btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;" onclick="viewDetails(${alumni.id})"><i class="fa-solid fa-eye"></i></button>` : '<span style="color:var(--text-secondary); font-size: 0.85rem;">Bypassed</span>'}
                    </div>
                    <button class="btn-secondary" title="Hapus Data" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; color: var(--danger); border-color: var(--danger);" onclick="deleteAlumniPrompt(${alumni.id})"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById('statusFilter').addEventListener('change', fetchAlumni);

window.toggleOptOut = async function (id, optOutValue) {
    try {
        const res = await fetch(`/api/alumni/${id}/opt_out`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ opt_out: optOutValue })
        });
        if (res.ok) {
            showToast(`Status Opt-Out diubah`, 'success');
            // Update hanya kolom Aksi pada baris ini tanpa re-render seluruh tabel
            const updatedAlumni = await res.json();
            const tbody = document.getElementById('alumniTbody');
            const rows = tbody.querySelectorAll('tr');
            rows.forEach(row => {
                const actionCell = row.querySelector('td:last-child');
                if (!actionCell) return;
                // Cari baris yang memiliki tombol/event dengan id yang sama
                if (actionCell.innerHTML.includes(`(${id})`)) {
                    const actionDiv = actionCell.querySelector('div');
                    if (actionDiv) {
                        const leftDiv = actionDiv.querySelector('div');
                        if (leftDiv) {
                            if (updatedAlumni.opt_out) {
                                leftDiv.innerHTML = '<span style="color:var(--text-secondary); font-size: 0.85rem;">Bypassed</span>';
                            } else {
                                leftDiv.innerHTML = `<button class="btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;" onclick="triggerTracking(${id})"><i class="fa-solid fa-search"></i> Lacak</button>
                                <button class="btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;" onclick="viewDetails(${id})"><i class="fa-solid fa-eye"></i></button>`;
                            }
                        }
                    }
                }
            });
        } else {
            showToast('Gagal mengubah status', 'error');
        }
    } catch (e) {
        showToast('Terjadi kesalahan jaringan', 'error');
    }
}

window.triggerTracking = async function (id) {
    showToast('Memulai pelacakan...', 'info');
    try {
        const res = await fetch(`/api/trigger_tracking/${id}`, { method: 'POST' });
        if (res.ok) {
            showToast('Pelacakan di latar belakang dimulai', 'success');
            setTimeout(fetchAlumni, 1000);
        } else {
            showToast('Gagal memicu pelacakan', 'error');
        }
    } catch (e) {
        showToast('Terjadi kesalahan', 'error');
    }
}

// Custom Confirm Modal Logic
let confirmCallback = null;

function showConfirm(title, message, onOk) {
    document.getElementById('confirmTitle').innerText = title;
    document.getElementById('confirmMessage').innerText = message;
    document.getElementById('confirmModal').classList.add('active');
    confirmCallback = onOk;
}

document.getElementById('btnConfirmCancel').addEventListener('click', () => {
    document.getElementById('confirmModal').classList.remove('active');
    confirmCallback = null;
});

document.getElementById('btnConfirmOk').addEventListener('click', () => {
    document.getElementById('confirmModal').classList.remove('active');
    if (confirmCallback) confirmCallback();
});

window.deleteAlumniPrompt = function (id) {
    showConfirm('Hapus Data Individual', 'Apakah Anda yakin ingin menghapus data alumni ini beserta seluruh historinya?', () => {
        executeDeleteAlumni(id);
    });
}

window.executeDeleteAlumni = async function (id) {
    try {
        const res = await fetch(`/api/alumni/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Alumni berhasil dihapus', 'success');
            fetchAlumni();
        } else {
            showToast('Gagal menghapus alumni', 'error');
        }
    } catch (e) {
        showToast('Terjadi kesalahan jaringan', 'error');
    }
}

window.viewDetails = async function (id) {
    document.getElementById('verifyModal').classList.add('active');
    const container = document.getElementById('verifyDetails');
    container.innerHTML = "<p>Sedang memuat hasil pencarian yang tersimpan...</p>";

    try {
        const res = await fetch(`/api/alumni/${id}/results`);
        if (res.ok) {
            const results = await res.json();
            if (results.length === 0) {
                container.innerHTML = "<p>Belum ada histori pelacakan untuk alumni ini.</p>";
                return;
            }

            let html = '<div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">';
            results.forEach(r => {
                html += `
                <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px; border: 1px solid var(--glass-border);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <strong>Sumber: ${r.source}</strong>
                        <span style="color: var(--accent);">Skor: ${r.confidence_score}</span>
                    </div>
                    <p style="font-size: 0.9rem; margin-bottom: 0.3rem;">Nama Ekstrak: ${r.extracted_name}</p>
                    <p style="font-size: 0.9rem; margin-bottom: 0.5rem;">Info Kampus Ekstrak: ${r.extracted_affiliation}</p>
                    <a href="${r.profile_url}" target="_blank" style="color: var(--accent); font-size: 0.85rem; text-decoration: none;"><i class="fa-solid fa-external-link-alt"></i> Kunjungi Profil</a>
                </div>
                `;
            });
            html += `
            <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                <button class="btn-primary" style="flex: 1;" onclick="updateStatus(${id}, 'Kemungkinan Kuat')"><i class="fa-solid fa-check"></i> Jadikan 'Kemungkinan Kuat'</button>
                <button class="btn-secondary" style="flex: 1; border-color: var(--danger); color: var(--danger);" onclick="updateStatus(${id}, 'Tidak Cocok')"><i class="fa-solid fa-times"></i> Jadikan 'Tidak Cocok'</button>
            </div>
            `;
            html += '</div>';
            container.innerHTML = html;
        } else {
            container.innerHTML = "<p style='color: var(--danger)'>Gagal memuat histori pelacakan.</p>";
        }
    } catch (e) {
        container.innerHTML = "<p style='color: var(--danger)'>Terjadi kesalahan saat memuat data.</p>";
    }
}

window.updateStatus = async function (id, status) {
    try {
        const res = await fetch(`/api/alumni/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (res.ok) {
            showToast(`Status diperbarui menjadi ${status}`, 'success');
            document.getElementById('verifyModal').classList.remove('active');
            fetchAlumni();
        } else {
            showToast('Gagal memperbarui status', 'error');
        }
    } catch (e) {
        showToast('Terjadi kesalahan jaringan', 'error');
    }
}

document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('verifyModal').classList.remove('active');
})

document.getElementById('btnTriggerAll').addEventListener('click', async () => {
    showToast('Menjadwalkan job...', 'info');
    try {
        const res = await fetch('/api/trigger_tracking_all', { method: 'POST' });
        if (res.ok) {
            showToast('Pelacakan massal dijalankan', 'success');
            setTimeout(fetchAlumni, 1500);
        }
    } catch (e) {
        showToast('Gagal menjadwalkan pelacakan', 'error');
    }
});

document.getElementById('btnAddNew').addEventListener('click', () => {
    document.getElementById('addModal').classList.add('active');
});

document.getElementById('closeAddModal').addEventListener('click', () => {
    document.getElementById('addModal').classList.remove('active');
    document.getElementById('addAlumniForm').reset();
});

document.getElementById('addAlumniForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Retrieve values mapping exactly to Pydantic schemas and DB logic
    const payload = {
        name: document.getElementById('addName').value.trim(),
        nama_kampus: document.getElementById('addNamaKampus').value.trim(),
        singkatan_kampus: document.getElementById('addSingkatanKampus').value.trim(),
        program: document.getElementById('addProdi').value.trim(),
        fakultas: document.getElementById('addFakultas').value.trim(),
        year_in: document.getElementById('addYearIn').value ? parseInt(document.getElementById('addYearIn').value) : null,
        year_out: document.getElementById('addYearOut').value ? parseInt(document.getElementById('addYearOut').value) : null,
        kota_asal: document.getElementById('addKotaAsal').value.trim(),
        variasi_nama: '', // optional string variants, currently unassigned by GUI inputs here
        opt_out: false
    };

    try {
        const res = await fetch('/api/alumni/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showToast('Alumni berhasil ditambahkan', 'success');
            document.getElementById('addModal').classList.remove('active');
            document.getElementById('addAlumniForm').reset();
            fetchAlumni();
        } else {
            const err = await res.json();
            showToast(err.detail || 'Data input tidak valid. Pastikan semua field lengkap.', 'error');
        }
    } catch (e) {
        showToast('Gagal menambahkan alumni', 'error');
    }
});



document.getElementById('btnDeleteAll').addEventListener('click', () => {
    showConfirm('Hapus Semua Data', 'PERINGATAN! Operasi ini akan menghapus semua master data alumni dari sistem. Tindakan ini tidak dapat dibatalkan.', async () => {
        showToast('Sedang menghapus semua data...', 'info');
        try {
            const res = await fetch('/api/alumni_all', { method: 'DELETE' });
            if (res.ok) {
                showToast('Semua data berhasil dihapus', 'success');
                fetchAlumni();
            } else {
                showToast('Gagal menghapus data', 'error');
            }
        } catch (err) {
            showToast('Terjadi kesalahan jaringan', 'error');
        }
    });
});

// Init
setInterval(fetchAlumni, 5000); // Polling for updates
fetchAlumni();
