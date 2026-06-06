GET /api2/json/nodes/

https://192.168.100.17:8006/api2/json/nodes

{"data":[{"maxmem":16718958592,"ssl_fingerprint":"5F:40:6C:F3:29:55:81:AB:2E:20:DB:C5:DE:CB:5C:0F:37:F0:80:FB:B3:52:A2:A9:F6:4E:C7:11:80:8A:7F:23","level":"","disk":11240390656,"node":"pve","status":"online","id":"node/pve","mem":2666278912,"uptime":20391,"cpu":0.00616793893129771,"maxdisk":23215472640,"maxcpu":16,"type":"node"}]}

GET /api2/json/nodes/{node}/storage

https://192.168.100.17:8006/api2/json/nodes/pve/storage

{"data":[{"shared":0,"used":11240329216,"active":1,"content":"vztmpl,iso,import,backup","used_fraction":0.484174041610208,"enabled":1,"avail":11975143424,"type":"dir","total":23215472640,"storage":"local"},{"avail":103501454336,"type":"zfspool","enabled":1,"used_fraction":0.000134940124214951,"storage":"vmdata","total":103515422720,"used":13968384,"shared":0,"content":"images,rootdir","active":1},{"type":"lvmthin","avail":3913305765,"enabled":1,"used_fraction":0.731199999976591,"storage":"local-lvm","total":14558429184,"used":10645123419,"shared":0,"content":"rootdir,images","active":1}]}


GET /api2/json/nodes/{node}/network

https://192.168.100.17:8006/api2/json/nodes/pve/network

{"data":[{"type":"bridge","method":"static","cidr":"192.168.200.134/24","priority":4,"netmask":"24","gateway":"192.168.200.2","active":1,"families":["inet"],"bridge_ports":"nic0","iface":"vmbr0","bridge_stp":"off","method6":"manual","address":"192.168.200.134","bridge_fd":"0","autostart":1},{"method":"manual","active":1,"families":["inet"],"type":"eth","priority":3,"exists":1,"altnames":["enp2s1","enx000c29d37e5a"],"iface":"nic0","method6":"manual"}]}

GET /api2/json/nodes/{node}/qemu

https://192.168.100.17:8006/api2/json/nodes/pve/qemu

{"data":[{"memhost":0,"name":"01","cpus":2,"netin":0,"template":1,"cpu":0,"vmid":101,"serial":1,"status":"stopped","uptime":0,"mem":0,"disk":0,"netout":0,"maxmem":4328521728,"maxdisk":34359738368},{"disk":0,"mem":740003840,"netout":3059,"pressurememoryfull":0,"pressureiofull":0,"maxdisk":34359738368,"pressureiosome":0,"maxmem":4328521728,"pid":60843,"cpus":2,"netin":4369,"memhost":740003840,"name":"test","pressurememorysome":0,"pressurecpufull":0,"pressurecpusome":0,"status":"running","uptime":1081,"cpu":0.0137168864545197,"vmid":100,"serial":1}]}


GET /api2/json/nodes/{node}/qemu/{vmid}/agent/network-get-interfaces

https://192.168.100.17:8006/api2/json/nodes/pve/qemu/100/agent

{"data":[{"name":"exec"},{"name":"exec-status"},{"name":"file-read"},{"name":"file-write"},{"name":"fsfreeze-freeze"},{"name":"fsfreeze-status"},{"name":"fsfreeze-thaw"},{"name":"fstrim"},{"name":"get-fsinfo"},{"name":"get-host-name"},{"name":"get-memory-block-info"},{"name":"get-memory-blocks"},{"name":"get-osinfo"},{"name":"get-time"},{"name":"get-timezone"},{"name":"get-users"},{"name":"get-vcpus"},{"name":"info"},{"name":"network-get-interfaces"},{"name":"ping"},{"name":"set-user-password"},{"name":"shutdown"},{"name":"suspend-disk"},{"name":"suspend-hybrid"},{"name":"suspend-ram"}]}

https://192.168.100.17:8006/api2/json/nodes/pve/qemu/100/agent/network-get-interfaces

{"data":{"result":[{"statistics":{"rx-errs":0,"rx-packets":84,"tx-bytes":6480,"rx-dropped":0,"rx-bytes":6480,"tx-dropped":0,"tx-errs":0,"tx-packets":84},"hardware-address":"00:00:00:00:00:00","ip-addresses":[{"ip-address":"127.0.0.1","ip-address-type":"ipv4","prefix":8},{"prefix":128,"ip-address-type":"ipv6","ip-address":"::1"}],"name":"lo"},{"name":"ens18","hardware-address":"bc:24:11:11:75:0e","statistics":{"tx-packets":19,"tx-errs":0,"tx-dropped":0,"rx-bytes":1644,"tx-bytes":1996,"rx-dropped":0,"rx-packets":11,"rx-errs":0},"ip-addresses":[{"ip-address":"192.168.200.139","ip-address-type":"ipv4","prefix":24},{"prefix":64,"ip-address-type":"ipv6","ip-address":"fe80::be24:11ff:fe11:750e"}]}]}}

https://192.168.100.17:8006/api2/json/nodes/pve/qemu

{"data":[{"name":"01","memhost":0,"cpus":2,"netin":0,"vmid":101,"template":1,"cpu":0,"serial":1,"status":"stopped","uptime":0,"mem":0,"disk":0,"netout":0,"maxmem":4328521728,"maxdisk":34359738368},{"pressurememoryfull":0,"netout":2554,"disk":0,"mem":739983360,"pid":60843,"maxmem":4328521728,"pressureiosome":0,"maxdisk":34359738368,"pressureiofull":0,"pressurememorysome":0,"pressurecpufull":0,"pressurecpusome":0,"name":"test","memhost":739983360,"netin":3697,"cpus":2,"serial":1,"vmid":100,"cpu":0.0193029356376134,"uptime":723,"status":"running"}]}

