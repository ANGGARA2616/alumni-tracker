#!/bin/bash
# Script untuk deploy backend FastAPI dan static frontend ke VPS

echo "=== Memulai Deployment Sistem Pelacakan Alumni ==="

# 1. Update sistem
echo "-> Update Ubuntu Packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install Dependencies Prapemrosesan
echo "-> Menginstall Python3, pip, dan virtualenv..."
sudo apt install python3 python3-pip python3-venv sqlite3 -y

# 3. Clone Repository
echo "-> Menyiapkan Folder Deploy..."
cd /var/www
# git clone https://github.com/mock-username/sistem-pelacakan-alumni.git
# cd sistem-pelacakan-alumni

# (Asumsi kita berada di folder project)
# 4. Setup Project
echo "-> Setup virtual environment..."
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 5. Setup Systemd Service
echo "-> Konfigurasi file Service untuk FastAPI..."
cat << EOF | sudo tee /etc/systemd/system/alumnitracker.service
[Unit]
Description=Gunicorn instance to serve Alumni Tracker App
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/var/www/sistem-pelacakan-alumni
Environment="PATH=/var/www/sistem-pelacakan-alumni/venv/bin"
ExecStart=/var/www/sistem-pelacakan-alumni/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000

[Install]
WantedBy=multi-user.target
EOF

# 6. Menjalankan Service
sudo systemctl daemon-reload
sudo systemctl start alumnitracker
sudo systemctl enable alumnitracker

echo "=== Deployment Selesai! Aplikasi berjalan di port 8000 ==="
