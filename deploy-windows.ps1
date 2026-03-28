# Data_Flavour Deployment Helper for Windows PowerShell
# Usage: .\deploy-windows.ps1

param(
    [string]$ServerIP = "192.168.56.105",
    [string]$Username = "hanif",
    [string]$Password = "1234"
)

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗"
Write-Host "║   Data_Flavour Deployment Helper (Windows PowerShell)  ║"
Write-Host "╚════════════════════════════════════════════════════════╝"
Write-Host ""

Write-Host "🔌 SSH Configuration:"
Write-Host "  Server:   $ServerIP"
Write-Host "  Username: $Username"
Write-Host ""

# Check if SSH is available
if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ SSH is not installed or not in PATH"
    Write-Host "   Install OpenSSH or use Windows Subsystem for Linux (WSL2)"
    exit 1
}

Write-Host "✅ SSH is available"
Write-Host ""

Write-Host "📋 Deployment Steps:"
Write-Host ""
Write-Host "1️⃣  Connect via SSH (you'll be prompted for password)"
Write-Host "   Command: ssh $Username@$ServerIP"
Write-Host ""
Write-Host "2️⃣  Clone the repository"
Write-Host "   $ cd ~"
Write-Host "   $ git clone https://github.com/abuhanif95/Data_Flavour.git"
Write-Host "   $ cd Data_Flavour"
Write-Host ""
Write-Host "3️⃣  Run the automated deployment script"
Write-Host "   $ chmod +x deploy.sh"
Write-Host "   $ ./deploy.sh"
Write-Host ""
Write-Host "4️⃣  Configure your backend"
Write-Host "   $ nano /opt/data-flavour/backend/.env"
Write-Host "   (Add your OPENAI_API_KEY)"
Write-Host ""
Write-Host "5️⃣  Access the app"
Write-Host "   Browser: http://$ServerIP"
Write-Host ""

Write-Host "🚀 Ready to deploy? Press Enter to start SSH connection..."
Read-Host

Write-Host ""
Write-Host "⏳ Connecting to $ServerIP..."
Write-Host ""

# Establish SSH connection (user will need to enter password)
ssh "$Username@$ServerIP"

Write-Host ""
Write-Host "✅ SSH session closed"
Write-Host ""
Write-Host "For more information, see DEPLOYMENT.md"
Write-Host ""
