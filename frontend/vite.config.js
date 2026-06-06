import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function apiSimulationPlugin() {
  return {
    name: 'api-simulation',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/provision' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              
              // Read .env from parent dir
              const envPath = path.resolve(__dirname, '../.env');
              let envVars = {};
              if (fs.existsSync(envPath)) {
                const envContent = fs.readFileSync(envPath, 'utf8');
                envContent.split('\n').forEach(line => {
                  const match = line.match(/^([^=]+)=(.*)$/);
                  if (match) {
                    envVars[match[1].trim()] = match[2].trim().replace(/^"(.*)"$/, '$1');
                  }
                });
              }

              const pm_api_url = envVars['PROXMOX_API_URL'] || 'https://proxmox.local:8006/api2/json';
              const pm_token_id = envVars['PROXMOX_API_TOKEN_ID'] || '';
              const pm_token_secret = envVars['PROXMOX_API_TOKEN_SECRET'] || '';
              const pm_target_node = envVars['PROXMOX_TARGET_NODE'] || 'pve';
              const pm_storage_id = envVars['PROXMOX_STORAGE_ID'] || 'local-lvm';
              const pm_network_bridge = envVars['PROXMOX_NETWORK_BRIDGE'] || 'vmbr0';

              // Format date: DDMMYYYY_His
              const now = new Date();
              const dd = String(now.getDate()).padStart(2, '0');
              const mm = String(now.getMonth() + 1).padStart(2, '0');
              const yyyy = now.getFullYear();
              const H = String(now.getHours()).padStart(2, '0');
              const i = String(now.getMinutes()).padStart(2, '0');
              const s = String(now.getSeconds()).padStart(2, '0');
              const dateStr = `${dd}${mm}${yyyy}_${H}${i}${s}`;

              const rawUsername = data.username || 'Andi';
              const username = rawUsername.replace(/\s+/g, '');
              
              const dirName = `date_pr${dateStr}`;
              const userDir = path.resolve(__dirname, '../', username);
              const targetDir = path.resolve(userDir, dirName);

              fs.mkdirSync(targetDir, { recursive: true });

              // Read master templates
              const masterDir = path.resolve(__dirname, '../backend/storage/app/master-provisioning/terraform');
              if (fs.existsSync(masterDir)) {
                ['main.tf', 'provider.tf', 'variables.tf'].forEach(file => {
                  const srcPath = path.join(masterDir, file);
                  const destPath = path.join(targetDir, file);
                  if (fs.existsSync(srcPath)) {
                    fs.copyFileSync(srcPath, destPath);
                  }
                });
              }

              const cores = data.tier === 'bronze' ? 1 : data.tier === 'silver' ? 2 : 3;
              const memory = data.tier === 'bronze' ? 1024 : data.tier === 'silver' ? 2048 : 3072;
              
              const templateName = "01"; 
              const vmName = `${data.vmPrefix}01`; // first VM naming format
              const vmid = Math.floor(Math.random() * 100) + 200; // random id for testing

              // Generate terraform.tfvars
              const tfvarsContent = `
proxmox_api_url          = "${pm_api_url}"
proxmox_api_token_id     = "${pm_token_id}"
proxmox_api_token_secret = "${pm_token_secret}"
proxmox_node             = "${pm_target_node}"
vm_name                  = "${vmName}"
vmid                     = ${vmid}
template_name            = "${templateName}"
cpu_cores                = ${cores}
ram_mb                   = ${memory}
disk_size                = "${data.diskSize}G"
storage_id               = "${pm_storage_id}"
network_bridge           = "${pm_network_bridge}"
ssh_public_key           = "ssh-rsa AAAAB3NzaC1yc2EAAA... mock-key"
`;
              fs.writeFileSync(path.resolve(targetDir, 'terraform.tfvars'), tfvarsContent.trim());

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, path: targetDir }));
            } catch (err) {
              console.error(err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else {
          next();
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), apiSimulationPlugin()],
})
