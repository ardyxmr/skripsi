2026-07-05 04:07:07.710 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.osutils.windows.WindowsUtils' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:07:08.156 2904 DEBUG cloudbaseinit.osutils.windows [-] Checking if service exists: cloudbase-init check_service_exists C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\osutils\windows.py:1121
2026-07-05 04:07:08.157 2904 DEBUG cloudbaseinit.osutils.windows [-] Getting service username: cloudbase-init get_service_username C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\osutils\windows.py:1254
2026-07-05 04:07:08.159 2904 INFO cloudbaseinit.osutils.windows [-] Skipping password reset, service running as a built-in account: LocalSystem
2026-07-05 04:07:08.170 2904 INFO cloudbaseinit.init [-] Cloudbase-Init version: 1.1.8
2026-07-05 04:07:08.170 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.plugins.common.mtu.MTUPlugin' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:07:08.176 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.plugins.windows.ntpclient.NTPClientPlugin' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:07:08.202 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.plugins.common.sethostname.SetHostNamePlugin' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:07:08.234 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.plugins.windows.createuser.CreateUserPlugin' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:07:08.261 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.plugins.common.networkconfig.NetworkConfigPlugin' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:07:08.278 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.plugins.windows.licensing.WindowsLicensingPlugin' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:07:08.317 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.plugins.common.sshpublickeys.SetUserSSHPublicKeysPlugin' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:07:08.330 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.plugins.windows.extendvolumes.ExtendVolumesPlugin' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:07:08.350 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.plugins.common.userdata.UserDataPlugin' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:07:08.446 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.plugins.common.setuserpassword.SetUserPasswordPlugin' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:07:08.791 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.plugins.windows.winrmlistener.ConfigWinRMListenerPlugin' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:07:08.938 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.plugins.windows.winrmcertificateauth.ConfigWinRMCertificateAuthPlugin' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:07:08.947 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.plugins.common.localscripts.LocalScriptsPlugin' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:07:08.963 2904 INFO cloudbaseinit.init [-] Executing plugins for stage 'PRE_NETWORKING':
2026-07-05 04:07:08.963 2904 INFO cloudbaseinit.init [-] Executing plugin 'NTPClientPlugin'
2026-07-05 04:07:08.964 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.osutils.windows.WindowsUtils' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:07:08.964 2904 DEBUG cloudbaseinit.osutils.windows [-] Getting service start mode for: w32time get_service_start_mode C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\osutils\windows.py:1141
2026-07-05 04:07:09.002 2904 DEBUG cloudbaseinit.osutils.windows [-] Getting service status for: w32time get_service_status C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\osutils\windows.py:1131
2026-07-05 04:07:09.002 2904 INFO cloudbaseinit.plugins.common.ntpclient [-] NTP client service enabled
2026-07-05 04:07:09.006 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.osutils.windows.WindowsUtils' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:07:09.009 2904 DEBUG cloudbaseinit.plugins.common.ntpclient [-] Could not obtain the NTP configuration via DHCP execute C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\plugins\common\ntpclient.py:71
2026-07-05 04:07:09.010 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.plugins.common.mtu.MTUPlugin' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:07:09.011 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.plugins.windows.ntpclient.NTPClientPlugin' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:07:09.011 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.plugins.common.sethostname.SetHostNamePlugin' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:07:09.011 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.plugins.windows.createuser.CreateUserPlugin' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:07:09.012 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.plugins.common.networkconfig.NetworkConfigPlugin' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:07:09.012 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.plugins.windows.licensing.WindowsLicensingPlugin' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:07:09.013 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.plugins.common.sshpublickeys.SetUserSSHPublicKeysPlugin' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:07:09.013 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.plugins.windows.extendvolumes.ExtendVolumesPlugin' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:07:09.013 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.plugins.common.userdata.UserDataPlugin' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:07:09.013 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.plugins.common.setuserpassword.SetUserPasswordPlugin' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:07:09.013 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.plugins.windows.winrmlistener.ConfigWinRMListenerPlugin' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:07:09.013 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.plugins.windows.winrmcertificateauth.ConfigWinRMCertificateAuthPlugin' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:07:09.013 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.plugins.common.localscripts.LocalScriptsPlugin' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:07:09.013 2904 INFO cloudbaseinit.init [-] Executing plugins for stage 'PRE_METADATA_DISCOVERY':
2026-07-05 04:07:09.013 2904 INFO cloudbaseinit.init [-] Executing plugin 'MTUPlugin'
2026-07-05 04:07:09.014 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.osutils.windows.WindowsUtils' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:07:09.017 2904 DEBUG urllib3.connectionpool [-] Starting new HTTPS connection (1): www.cloudbase.it:443 _new_conn C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py:1049
2026-07-05 04:07:09.018 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.osutils.windows.WindowsUtils' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:07:09.021 2904 DEBUG cloudbaseinit.plugins.common.mtu [-] Could not obtain the MTU configuration via DHCP for interface "BC:24:11:10:F6:53" execute C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\plugins\common\mtu.py:45
2026-07-05 04:07:09.021 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.metadata.services.httpservice.HttpService' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:07:09.029 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.osutils.windows.WindowsUtils' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:07:09.029 2904 DEBUG cloudbaseinit.utils.network [-] Testing url: http://169.254.169.254/ check_url C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\network.py:49
2026-07-05 04:07:10.707 2904 DEBUG urllib3.connectionpool [-] https://www.cloudbase.it:443 "GET /checkupdates.php?p=Cloudbase-Init&v=1.1.8 HTTP/1.1" 502 158 _make_request C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py:544
2026-07-05 04:07:10.708 2904 DEBUG cloudbaseinit.version [-] Failed checking for new versions: 502 Server Error: Bad Gateway for url: https://www.cloudbase.it/checkupdates.php?p=Cloudbase-Init&v=1.1.8 _check_latest_version C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\version.py:49
2026-07-05 04:07:31.522 2904 DEBUG cloudbaseinit.utils.network [-] Testing url: http://169.254.169.254/ check_url C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\network.py:49
2026-07-05 04:07:52.575 2904 DEBUG cloudbaseinit.utils.network [-] Testing url: http://169.254.169.254/ check_url C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\network.py:49
2026-07-05 04:08:13.633 2904 DEBUG cloudbaseinit.utils.network [-] Setting gateway for host: 169.254.169.254 check_metadata_ip_route C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\network.py:73
2026-07-05 04:08:13.653 2904 DEBUG cloudbaseinit.metadata.services.base [-] Executing http request GET at http://169.254.169.254/openstack/latest/meta_data.json _http_request C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py:340
2026-07-05 04:08:13.654 2904 DEBUG urllib3.connectionpool [-] Starting new HTTP connection (1): 169.254.169.254:80 _new_conn C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py:241
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base [-] HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /openstack/latest/meta_data.json (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it")): requests.exceptions.ConnectionError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /openstack/latest/meta_data.json (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 204, in _new_conn
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     sock = connection.create_connection(
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base         (self._dns_host, self.port),
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     ...<2 lines>...
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base         socket_options=self.socket_options,
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\connection.py", line 85, in create_connection
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     raise err
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\connection.py", line 73, in create_connection
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     sock.connect(sa)
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^^^^
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base ConnectionRefusedError: [WinError 10061] No connection could be made because the target machine actively refused it
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base The above exception was the direct cause of the following exception:
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 787, in urlopen
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     response = self._make_request(
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base         conn,
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     ...<10 lines>...
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base         **response_kw,
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 493, in _make_request
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     conn.request(
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base         method,
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base         ^^^^^^^
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     ...<6 lines>...
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base         enforce_content_length=enforce_content_length,
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     ^
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 500, in request
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     self.endheaders()
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~~~~^^
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1353, in endheaders
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     self._send_output(message_body, encode_chunked=encode_chunked)
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1113, in _send_output
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     self.send(msg)
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~^^^^^
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1057, in send
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     self.connect()
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^^
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 331, in connect
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     self.sock = self._new_conn()
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base                 ~~~~~~~~~~~~~~^^
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 219, in _new_conn
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     raise NewConnectionError(
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base         self, f"Failed to establish a new connection: {e}"
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     ) from e
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base urllib3.exceptions.NewConnectionError: HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base The above exception was the direct cause of the following exception:
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\adapters.py", line 645, in send
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     resp = conn.urlopen(
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base         method=request.method,
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     ...<9 lines>...
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base         chunked=chunked,
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 841, in urlopen
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     retries = retries.increment(
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base         method, url, error=new_e, _pool=self, _stacktrace=sys.exc_info()[2]
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\retry.py", line 535, in increment
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     raise MaxRetryError(_pool, url, reason) from reason  # type: ignore[arg-type]
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base urllib3.exceptions.MaxRetryError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /openstack/latest/meta_data.json (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base During handling of the above exception, another exception occurred:
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 350, in _get_data
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     response = self._http_request(path)
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 341, in _http_request
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     response = requests.request(method=method, url=url, data=data,
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base                                 headers=headers,
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base                                 verify=self._verify_https_request())
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\api.py", line 59, in request
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     return session.request(method=method, url=url, **kwargs)
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base            ~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\sessions.py", line 592, in request
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     resp = self.send(prep, **send_kwargs)
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\sessions.py", line 706, in send
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     r = adapter.send(request, **kwargs)
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\adapters.py", line 678, in send
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base     raise ConnectionError(e, request=request)
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base requests.exceptions.ConnectionError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /openstack/latest/meta_data.json (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:08:15.712 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:19.762 2904 DEBUG cloudbaseinit.metadata.services.base [-] Executing http request GET at http://169.254.169.254/openstack/latest/meta_data.json _http_request C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py:340
2026-07-05 04:08:19.763 2904 DEBUG urllib3.connectionpool [-] Starting new HTTP connection (1): 169.254.169.254:80 _new_conn C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py:241
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base [-] HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /openstack/latest/meta_data.json (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it")): requests.exceptions.ConnectionError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /openstack/latest/meta_data.json (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 204, in _new_conn
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     sock = connection.create_connection(
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base         (self._dns_host, self.port),
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     ...<2 lines>...
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base         socket_options=self.socket_options,
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\connection.py", line 85, in create_connection
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     raise err
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\connection.py", line 73, in create_connection
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     sock.connect(sa)
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^^^^
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base ConnectionRefusedError: [WinError 10061] No connection could be made because the target machine actively refused it
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base The above exception was the direct cause of the following exception:
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 787, in urlopen
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     response = self._make_request(
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base         conn,
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     ...<10 lines>...
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base         **response_kw,
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 493, in _make_request
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     conn.request(
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base         method,
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base         ^^^^^^^
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     ...<6 lines>...
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base         enforce_content_length=enforce_content_length,
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     ^
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 500, in request
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     self.endheaders()
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~~~~^^
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1353, in endheaders
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     self._send_output(message_body, encode_chunked=encode_chunked)
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1113, in _send_output
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     self.send(msg)
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~^^^^^
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1057, in send
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     self.connect()
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^^
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 331, in connect
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     self.sock = self._new_conn()
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base                 ~~~~~~~~~~~~~~^^
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 219, in _new_conn
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     raise NewConnectionError(
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base         self, f"Failed to establish a new connection: {e}"
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     ) from e
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base urllib3.exceptions.NewConnectionError: HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base The above exception was the direct cause of the following exception:
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\adapters.py", line 645, in send
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     resp = conn.urlopen(
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base         method=request.method,
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     ...<9 lines>...
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base         chunked=chunked,
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 841, in urlopen
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     retries = retries.increment(
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base         method, url, error=new_e, _pool=self, _stacktrace=sys.exc_info()[2]
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\retry.py", line 535, in increment
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     raise MaxRetryError(_pool, url, reason) from reason  # type: ignore[arg-type]
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base urllib3.exceptions.MaxRetryError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /openstack/latest/meta_data.json (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base During handling of the above exception, another exception occurred:
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 350, in _get_data
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     response = self._http_request(path)
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 341, in _http_request
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     response = requests.request(method=method, url=url, data=data,
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base                                 headers=headers,
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base                                 verify=self._verify_https_request())
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\api.py", line 59, in request
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     return session.request(method=method, url=url, **kwargs)
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base            ~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\sessions.py", line 592, in request
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     resp = self.send(prep, **send_kwargs)
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\sessions.py", line 706, in send
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     r = adapter.send(request, **kwargs)
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\adapters.py", line 678, in send
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base     raise ConnectionError(e, request=request)
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base requests.exceptions.ConnectionError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /openstack/latest/meta_data.json (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:08:21.827 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:25.832 2904 DEBUG cloudbaseinit.metadata.services.base [-] Executing http request GET at http://169.254.169.254/openstack/latest/meta_data.json _http_request C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py:340
2026-07-05 04:08:25.833 2904 DEBUG urllib3.connectionpool [-] Starting new HTTP connection (1): 169.254.169.254:80 _new_conn C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py:241
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base [-] HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /openstack/latest/meta_data.json (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it")): requests.exceptions.ConnectionError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /openstack/latest/meta_data.json (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 204, in _new_conn
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     sock = connection.create_connection(
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base         (self._dns_host, self.port),
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     ...<2 lines>...
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base         socket_options=self.socket_options,
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\connection.py", line 85, in create_connection
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     raise err
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\connection.py", line 73, in create_connection
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     sock.connect(sa)
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^^^^
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base ConnectionRefusedError: [WinError 10061] No connection could be made because the target machine actively refused it
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base The above exception was the direct cause of the following exception:
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 787, in urlopen
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     response = self._make_request(
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base         conn,
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     ...<10 lines>...
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base         **response_kw,
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 493, in _make_request
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     conn.request(
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base         method,
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base         ^^^^^^^
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     ...<6 lines>...
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base         enforce_content_length=enforce_content_length,
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     ^
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 500, in request
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     self.endheaders()
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~~~~^^
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1353, in endheaders
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     self._send_output(message_body, encode_chunked=encode_chunked)
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1113, in _send_output
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     self.send(msg)
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~^^^^^
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1057, in send
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     self.connect()
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^^
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 331, in connect
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     self.sock = self._new_conn()
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base                 ~~~~~~~~~~~~~~^^
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 219, in _new_conn
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     raise NewConnectionError(
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base         self, f"Failed to establish a new connection: {e}"
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     ) from e
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base urllib3.exceptions.NewConnectionError: HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base The above exception was the direct cause of the following exception:
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\adapters.py", line 645, in send
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     resp = conn.urlopen(
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base         method=request.method,
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     ...<9 lines>...
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base         chunked=chunked,
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 841, in urlopen
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     retries = retries.increment(
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base         method, url, error=new_e, _pool=self, _stacktrace=sys.exc_info()[2]
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\retry.py", line 535, in increment
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     raise MaxRetryError(_pool, url, reason) from reason  # type: ignore[arg-type]
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base urllib3.exceptions.MaxRetryError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /openstack/latest/meta_data.json (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base During handling of the above exception, another exception occurred:
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 350, in _get_data
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     response = self._http_request(path)
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 341, in _http_request
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     response = requests.request(method=method, url=url, data=data,
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base                                 headers=headers,
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base                                 verify=self._verify_https_request())
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\api.py", line 59, in request
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     return session.request(method=method, url=url, **kwargs)
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base            ~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\sessions.py", line 592, in request
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     resp = self.send(prep, **send_kwargs)
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\sessions.py", line 706, in send
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     r = adapter.send(request, **kwargs)
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\adapters.py", line 678, in send
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base     raise ConnectionError(e, request=request)
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base requests.exceptions.ConnectionError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /openstack/latest/meta_data.json (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:08:27.892 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:31.896 2904 DEBUG cloudbaseinit.metadata.services.base [-] Executing http request GET at http://169.254.169.254/openstack/latest/meta_data.json _http_request C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py:340
2026-07-05 04:08:31.897 2904 DEBUG urllib3.connectionpool [-] Starting new HTTP connection (1): 169.254.169.254:80 _new_conn C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py:241
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base [-] HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /openstack/latest/meta_data.json (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it")): requests.exceptions.ConnectionError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /openstack/latest/meta_data.json (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 204, in _new_conn
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     sock = connection.create_connection(
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base         (self._dns_host, self.port),
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     ...<2 lines>...
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base         socket_options=self.socket_options,
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\connection.py", line 85, in create_connection
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     raise err
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\connection.py", line 73, in create_connection
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     sock.connect(sa)
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^^^^
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base ConnectionRefusedError: [WinError 10061] No connection could be made because the target machine actively refused it
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base The above exception was the direct cause of the following exception:
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 787, in urlopen
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     response = self._make_request(
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base         conn,
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     ...<10 lines>...
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base         **response_kw,
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 493, in _make_request
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     conn.request(
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base         method,
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base         ^^^^^^^
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     ...<6 lines>...
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base         enforce_content_length=enforce_content_length,
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     ^
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 500, in request
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     self.endheaders()
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~~~~^^
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1353, in endheaders
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     self._send_output(message_body, encode_chunked=encode_chunked)
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1113, in _send_output
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     self.send(msg)
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~^^^^^
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1057, in send
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     self.connect()
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^^
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 331, in connect
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     self.sock = self._new_conn()
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base                 ~~~~~~~~~~~~~~^^
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 219, in _new_conn
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     raise NewConnectionError(
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base         self, f"Failed to establish a new connection: {e}"
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     ) from e
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base urllib3.exceptions.NewConnectionError: HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base The above exception was the direct cause of the following exception:
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\adapters.py", line 645, in send
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     resp = conn.urlopen(
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base         method=request.method,
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     ...<9 lines>...
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base         chunked=chunked,
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 841, in urlopen
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     retries = retries.increment(
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base         method, url, error=new_e, _pool=self, _stacktrace=sys.exc_info()[2]
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\retry.py", line 535, in increment
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     raise MaxRetryError(_pool, url, reason) from reason  # type: ignore[arg-type]
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base urllib3.exceptions.MaxRetryError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /openstack/latest/meta_data.json (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base During handling of the above exception, another exception occurred:
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 350, in _get_data
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     response = self._http_request(path)
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 341, in _http_request
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     response = requests.request(method=method, url=url, data=data,
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base                                 headers=headers,
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base                                 verify=self._verify_https_request())
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\api.py", line 59, in request
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     return session.request(method=method, url=url, **kwargs)
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base            ~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\sessions.py", line 592, in request
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     resp = self.send(prep, **send_kwargs)
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\sessions.py", line 706, in send
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     r = adapter.send(request, **kwargs)
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\adapters.py", line 678, in send
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base     raise ConnectionError(e, request=request)
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base requests.exceptions.ConnectionError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /openstack/latest/meta_data.json (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:08:33.955 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:37.959 2904 DEBUG cloudbaseinit.metadata.services.base [-] Executing http request GET at http://169.254.169.254/openstack/latest/meta_data.json _http_request C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py:340
2026-07-05 04:08:37.960 2904 DEBUG urllib3.connectionpool [-] Starting new HTTP connection (1): 169.254.169.254:80 _new_conn C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py:241
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base [-] HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /openstack/latest/meta_data.json (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it")): requests.exceptions.ConnectionError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /openstack/latest/meta_data.json (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 204, in _new_conn
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     sock = connection.create_connection(
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base         (self._dns_host, self.port),
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     ...<2 lines>...
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base         socket_options=self.socket_options,
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\connection.py", line 85, in create_connection
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     raise err
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\connection.py", line 73, in create_connection
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     sock.connect(sa)
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^^^^
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base ConnectionRefusedError: [WinError 10061] No connection could be made because the target machine actively refused it
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base The above exception was the direct cause of the following exception:
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 787, in urlopen
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     response = self._make_request(
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base         conn,
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     ...<10 lines>...
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base         **response_kw,
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 493, in _make_request
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     conn.request(
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base         method,
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base         ^^^^^^^
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     ...<6 lines>...
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base         enforce_content_length=enforce_content_length,
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     ^
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 500, in request
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     self.endheaders()
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~~~~^^
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1353, in endheaders
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     self._send_output(message_body, encode_chunked=encode_chunked)
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1113, in _send_output
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     self.send(msg)
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~^^^^^
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1057, in send
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     self.connect()
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^^
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 331, in connect
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     self.sock = self._new_conn()
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base                 ~~~~~~~~~~~~~~^^
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 219, in _new_conn
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     raise NewConnectionError(
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base         self, f"Failed to establish a new connection: {e}"
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     ) from e
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base urllib3.exceptions.NewConnectionError: HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base The above exception was the direct cause of the following exception:
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\adapters.py", line 645, in send
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     resp = conn.urlopen(
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base         method=request.method,
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     ...<9 lines>...
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base         chunked=chunked,
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 841, in urlopen
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     retries = retries.increment(
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base         method, url, error=new_e, _pool=self, _stacktrace=sys.exc_info()[2]
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\retry.py", line 535, in increment
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     raise MaxRetryError(_pool, url, reason) from reason  # type: ignore[arg-type]
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base urllib3.exceptions.MaxRetryError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /openstack/latest/meta_data.json (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base During handling of the above exception, another exception occurred:
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 350, in _get_data
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     response = self._http_request(path)
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 341, in _http_request
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     response = requests.request(method=method, url=url, data=data,
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base                                 headers=headers,
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base                                 verify=self._verify_https_request())
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\api.py", line 59, in request
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     return session.request(method=method, url=url, **kwargs)
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base            ~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\sessions.py", line 592, in request
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     resp = self.send(prep, **send_kwargs)
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\sessions.py", line 706, in send
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     r = adapter.send(request, **kwargs)
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\adapters.py", line 678, in send
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base     raise ConnectionError(e, request=request)
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base requests.exceptions.ConnectionError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /openstack/latest/meta_data.json (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:08:40.018 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:44.022 2904 DEBUG cloudbaseinit.metadata.services.base [-] Executing http request GET at http://169.254.169.254/openstack/latest/meta_data.json _http_request C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py:340
2026-07-05 04:08:44.023 2904 DEBUG urllib3.connectionpool [-] Starting new HTTP connection (1): 169.254.169.254:80 _new_conn C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py:241
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base [-] HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /openstack/latest/meta_data.json (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it")): requests.exceptions.ConnectionError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /openstack/latest/meta_data.json (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 204, in _new_conn
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     sock = connection.create_connection(
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base         (self._dns_host, self.port),
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     ...<2 lines>...
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base         socket_options=self.socket_options,
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\connection.py", line 85, in create_connection
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     raise err
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\connection.py", line 73, in create_connection
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     sock.connect(sa)
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^^^^
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base ConnectionRefusedError: [WinError 10061] No connection could be made because the target machine actively refused it
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base The above exception was the direct cause of the following exception:
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 787, in urlopen
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     response = self._make_request(
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base         conn,
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     ...<10 lines>...
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base         **response_kw,
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 493, in _make_request
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     conn.request(
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base         method,
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base         ^^^^^^^
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     ...<6 lines>...
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base         enforce_content_length=enforce_content_length,
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     ^
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 500, in request
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     self.endheaders()
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~~~~^^
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1353, in endheaders
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     self._send_output(message_body, encode_chunked=encode_chunked)
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1113, in _send_output
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     self.send(msg)
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~^^^^^
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1057, in send
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     self.connect()
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^^
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 331, in connect
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     self.sock = self._new_conn()
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base                 ~~~~~~~~~~~~~~^^
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 219, in _new_conn
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     raise NewConnectionError(
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base         self, f"Failed to establish a new connection: {e}"
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     ) from e
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base urllib3.exceptions.NewConnectionError: HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base The above exception was the direct cause of the following exception:
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\adapters.py", line 645, in send
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     resp = conn.urlopen(
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base         method=request.method,
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     ...<9 lines>...
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base         chunked=chunked,
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 841, in urlopen
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     retries = retries.increment(
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base         method, url, error=new_e, _pool=self, _stacktrace=sys.exc_info()[2]
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\retry.py", line 535, in increment
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     raise MaxRetryError(_pool, url, reason) from reason  # type: ignore[arg-type]
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base urllib3.exceptions.MaxRetryError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /openstack/latest/meta_data.json (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base During handling of the above exception, another exception occurred:
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 350, in _get_data
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     response = self._http_request(path)
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 341, in _http_request
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     response = requests.request(method=method, url=url, data=data,
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base                                 headers=headers,
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base                                 verify=self._verify_https_request())
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\api.py", line 59, in request
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     return session.request(method=method, url=url, **kwargs)
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base            ~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\sessions.py", line 592, in request
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     resp = self.send(prep, **send_kwargs)
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\sessions.py", line 706, in send
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     r = adapter.send(request, **kwargs)
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\adapters.py", line 678, in send
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base     raise ConnectionError(e, request=request)
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base requests.exceptions.ConnectionError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /openstack/latest/meta_data.json (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:08:46.083 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:46.086 2904 DEBUG cloudbaseinit.metadata.services.httpservice [-] Metadata not found at URL 'http://169.254.169.254/' load C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\httpservice.py:47
2026-07-05 04:08:46.086 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.metadata.services.configdrive.ConfigDriveService' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:08:46.091 2904 WARNING oslo_config.cfg [-] Deprecated: Option "config_drive_raw_hhd" from group "DEFAULT" is deprecated. Use option "raw_hdd" from group "config_drive".
2026-07-05 04:08:46.092 2904 WARNING oslo_config.cfg [-] Deprecated: Option "raw_hdd" from group "config_drive" is deprecated for removal.  Its value may be silently ignored in the future.
2026-07-05 04:08:46.092 2904 WARNING oslo_config.cfg [-] Deprecated: Option "config_drive_cdrom" from group "DEFAULT" is deprecated. Use option "cdrom" from group "config_drive".
2026-07-05 04:08:46.092 2904 WARNING oslo_config.cfg [-] Deprecated: Option "cdrom" from group "config_drive" is deprecated for removal.  Its value may be silently ignored in the future.
2026-07-05 04:08:46.092 2904 WARNING oslo_config.cfg [-] Deprecated: Option "config_drive_vfat" from group "DEFAULT" is deprecated. Use option "vfat" from group "config_drive".
2026-07-05 04:08:46.092 2904 WARNING oslo_config.cfg [-] Deprecated: Option "vfat" from group "config_drive" is deprecated for removal.  Its value may be silently ignored in the future.
2026-07-05 04:08:46.092 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.metadata.services.osconfigdrive.windows.WindowsConfigDriveManager' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:08:46.097 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.osutils.windows.WindowsUtils' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:08:46.098 2904 DEBUG cloudbaseinit.metadata.services.osconfigdrive.windows [-] Looking for Config Drive vfat in cdrom with expected label config-2 get_config_drive_files C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\osconfigdrive\windows.py:221
2026-07-05 04:08:46.098 2904 DEBUG cloudbaseinit.metadata.services.osconfigdrive.windows [-] Irrelevant type vfat in cdrom location; skip _get_config_drive_files C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\osconfigdrive\windows.py:204
2026-07-05 04:08:46.098 2904 DEBUG cloudbaseinit.metadata.services.osconfigdrive.windows [-] Looking for Config Drive vfat in partition with expected label config-2 get_config_drive_files C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\osconfigdrive\windows.py:221
2026-07-05 04:08:46.098 2904 DEBUG cloudbaseinit.metadata.services.osconfigdrive.windows [-] Looking for a Config Drive with label 'config-2' on '\\?\Volume{295da346-d41a-4322-866e-0e66307b6bcd}\'. Found mismatching label ''. _check_for_config_drive C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\osconfigdrive\windows.py:68
2026-07-05 04:08:46.098 2904 DEBUG cloudbaseinit.metadata.services.osconfigdrive.windows [-] Looking for a Config Drive with label 'config-2' on '\\?\Volume{cb8a2bbf-e696-4e11-a26c-3fbc143fd4d1}\'. Found mismatching label ''. _check_for_config_drive C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\osconfigdrive\windows.py:68
2026-07-05 04:08:46.098 2904 DEBUG cloudbaseinit.metadata.services.osconfigdrive.windows [-] Looking for a Config Drive with label 'config-2' on '\\?\Volume{66c44aad-ec15-4961-8b87-4d491142aca3}\'. Found mismatching label ''. _check_for_config_drive C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\osconfigdrive\windows.py:68
2026-07-05 04:08:46.099 2904 DEBUG cloudbaseinit.metadata.services.osconfigdrive.windows [-] Looking for a Config Drive with label 'config-2' on '\\?\Volume{86e65ae8-78d6-11f1-b63d-806e6f6e6963}\'. Found mismatching label 'SSS_X64FREE_EN-US_DV9'. _check_for_config_drive C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\osconfigdrive\windows.py:68
2026-07-05 04:08:46.099 2904 DEBUG cloudbaseinit.metadata.services.osconfigdrive.windows [-] Looking for a Config Drive with label 'config-2' on '\\?\Volume{86e65ae9-78d6-11f1-b63d-806e6f6e6963}\'. Found mismatching label 'virtio-win-0.1.285'. _check_for_config_drive C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\osconfigdrive\windows.py:68
2026-07-05 04:08:46.099 2904 DEBUG cloudbaseinit.metadata.services.osconfigdrive.windows [-] Looking for Config Drive vfat in hdd with expected label config-2 get_config_drive_files C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\osconfigdrive\windows.py:221
2026-07-05 04:08:46.136 2904 DEBUG cloudbaseinit.utils.windows.vfat [-] Could not retrieve label for VFAT drive path '\\\\.\\PHYSICALDRIVE0' is_vfat_drive C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\windows\vfat.py:44
2026-07-05 04:08:46.137 2904 DEBUG cloudbaseinit.utils.windows.vfat [-] mlabel failed with error b"init :: sector size (190) not a small power of two\r\nCannot initialize '::'\r\nC:\\Program Files\\Cloudbase Solutions\\Cloudbase-Init\\bin\\mlabel: Cannot initialize drive\r\n" is_vfat_drive C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\windows\vfat.py:46
2026-07-05 04:08:46.137 2904 DEBUG cloudbaseinit.metadata.services.osconfigdrive.windows [-] Looking for Config Drive iso in cdrom with expected label config-2 get_config_drive_files C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\osconfigdrive\windows.py:221
2026-07-05 04:08:46.137 2904 DEBUG cloudbaseinit.metadata.services.osconfigdrive.windows [-] Looking for a Config Drive with label 'config-2' on 'D:\'. Found mismatching label 'SSS_X64FREE_EN-US_DV9'. _check_for_config_drive C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\osconfigdrive\windows.py:68
2026-07-05 04:08:46.138 2904 DEBUG cloudbaseinit.metadata.services.osconfigdrive.windows [-] Looking for a Config Drive with label 'config-2' on 'E:\'. Found mismatching label 'virtio-win-0.1.285'. _check_for_config_drive C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\osconfigdrive\windows.py:68
2026-07-05 04:08:46.138 2904 DEBUG cloudbaseinit.metadata.services.osconfigdrive.windows [-] Looking for Config Drive iso in partition with expected label config-2 get_config_drive_files C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\osconfigdrive\windows.py:221
2026-07-05 04:08:46.139 2904 WARNING cloudbaseinit.metadata.services.osconfigdrive.windows [-] ISO extraction failed on <Partition: \\?\GLOBALROOT\Device\Harddisk0\Partition1> with WindowsCloudbaseInitException("Cannot open file: 'The process cannot access the file because it is being used by another process.'"): cloudbaseinit.exception.WindowsCloudbaseInitException: Cannot open file: 'The process cannot access the file because it is being used by another process.'
2026-07-05 04:08:46.379 2904 WARNING cloudbaseinit.metadata.services.osconfigdrive.windows [-] ISO extraction failed on <Partition: \\?\GLOBALROOT\Device\Harddisk0\Partition3> with WindowsCloudbaseInitException("Cannot open file: 'The process cannot access the file because it is being used by another process.'"): cloudbaseinit.exception.WindowsCloudbaseInitException: Cannot open file: 'The process cannot access the file because it is being used by another process.'
2026-07-05 04:08:46.411 2904 DEBUG cloudbaseinit.metadata.services.osconfigdrive.windows [-] Looking for Config Drive iso in hdd with expected label config-2 get_config_drive_files C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\osconfigdrive\windows.py:221
2026-07-05 04:08:46.413 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.metadata.services.ec2service.EC2Service' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:08:46.418 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.osutils.windows.WindowsUtils' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:08:46.418 2904 DEBUG cloudbaseinit.metadata.services.base [-] Executing http request GET at http://169.254.169.254/2009-04-04/meta-data/local-hostname _http_request C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py:340
2026-07-05 04:08:46.419 2904 DEBUG urllib3.connectionpool [-] Starting new HTTP connection (1): 169.254.169.254:80 _new_conn C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py:241
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base [-] HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /2009-04-04/meta-data/local-hostname (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it")): requests.exceptions.ConnectionError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /2009-04-04/meta-data/local-hostname (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 204, in _new_conn
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     sock = connection.create_connection(
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base         (self._dns_host, self.port),
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     ...<2 lines>...
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base         socket_options=self.socket_options,
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\connection.py", line 85, in create_connection
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     raise err
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\connection.py", line 73, in create_connection
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     sock.connect(sa)
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^^^^
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base ConnectionRefusedError: [WinError 10061] No connection could be made because the target machine actively refused it
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base The above exception was the direct cause of the following exception:
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 787, in urlopen
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     response = self._make_request(
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base         conn,
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     ...<10 lines>...
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base         **response_kw,
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 493, in _make_request
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     conn.request(
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base         method,
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base         ^^^^^^^
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     ...<6 lines>...
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base         enforce_content_length=enforce_content_length,
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     ^
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 500, in request
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     self.endheaders()
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~~~~^^
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1353, in endheaders
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     self._send_output(message_body, encode_chunked=encode_chunked)
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1113, in _send_output
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     self.send(msg)
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~^^^^^
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1057, in send
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     self.connect()
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^^
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 331, in connect
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     self.sock = self._new_conn()
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base                 ~~~~~~~~~~~~~~^^
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 219, in _new_conn
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     raise NewConnectionError(
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base         self, f"Failed to establish a new connection: {e}"
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     ) from e
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base urllib3.exceptions.NewConnectionError: HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base The above exception was the direct cause of the following exception:
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\adapters.py", line 645, in send
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     resp = conn.urlopen(
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base         method=request.method,
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     ...<9 lines>...
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base         chunked=chunked,
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 841, in urlopen
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     retries = retries.increment(
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base         method, url, error=new_e, _pool=self, _stacktrace=sys.exc_info()[2]
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\retry.py", line 535, in increment
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     raise MaxRetryError(_pool, url, reason) from reason  # type: ignore[arg-type]
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base urllib3.exceptions.MaxRetryError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /2009-04-04/meta-data/local-hostname (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base During handling of the above exception, another exception occurred:
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 350, in _get_data
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     response = self._http_request(path)
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 341, in _http_request
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     response = requests.request(method=method, url=url, data=data,
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base                                 headers=headers,
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base                                 verify=self._verify_https_request())
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\api.py", line 59, in request
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     return session.request(method=method, url=url, **kwargs)
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base            ~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\sessions.py", line 592, in request
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     resp = self.send(prep, **send_kwargs)
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\sessions.py", line 706, in send
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     r = adapter.send(request, **kwargs)
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\adapters.py", line 678, in send
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base     raise ConnectionError(e, request=request)
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base requests.exceptions.ConnectionError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /2009-04-04/meta-data/local-hostname (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:08:48.458 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:52.468 2904 DEBUG cloudbaseinit.metadata.services.base [-] Executing http request GET at http://169.254.169.254/2009-04-04/meta-data/local-hostname _http_request C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py:340
2026-07-05 04:08:52.470 2904 DEBUG urllib3.connectionpool [-] Starting new HTTP connection (1): 169.254.169.254:80 _new_conn C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py:241
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base [-] HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /2009-04-04/meta-data/local-hostname (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it")): requests.exceptions.ConnectionError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /2009-04-04/meta-data/local-hostname (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 204, in _new_conn
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     sock = connection.create_connection(
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base         (self._dns_host, self.port),
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     ...<2 lines>...
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base         socket_options=self.socket_options,
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\connection.py", line 85, in create_connection
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     raise err
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\connection.py", line 73, in create_connection
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     sock.connect(sa)
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^^^^
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base ConnectionRefusedError: [WinError 10061] No connection could be made because the target machine actively refused it
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base The above exception was the direct cause of the following exception:
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 787, in urlopen
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     response = self._make_request(
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base         conn,
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     ...<10 lines>...
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base         **response_kw,
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 493, in _make_request
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     conn.request(
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base         method,
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base         ^^^^^^^
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     ...<6 lines>...
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base         enforce_content_length=enforce_content_length,
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     ^
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 500, in request
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     self.endheaders()
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~~~~^^
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1353, in endheaders
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     self._send_output(message_body, encode_chunked=encode_chunked)
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1113, in _send_output
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     self.send(msg)
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~^^^^^
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1057, in send
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     self.connect()
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^^
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 331, in connect
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     self.sock = self._new_conn()
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base                 ~~~~~~~~~~~~~~^^
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 219, in _new_conn
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     raise NewConnectionError(
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base         self, f"Failed to establish a new connection: {e}"
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     ) from e
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base urllib3.exceptions.NewConnectionError: HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base The above exception was the direct cause of the following exception:
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\adapters.py", line 645, in send
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     resp = conn.urlopen(
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base         method=request.method,
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     ...<9 lines>...
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base         chunked=chunked,
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 841, in urlopen
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     retries = retries.increment(
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base         method, url, error=new_e, _pool=self, _stacktrace=sys.exc_info()[2]
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\retry.py", line 535, in increment
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     raise MaxRetryError(_pool, url, reason) from reason  # type: ignore[arg-type]
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base urllib3.exceptions.MaxRetryError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /2009-04-04/meta-data/local-hostname (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base During handling of the above exception, another exception occurred:
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 350, in _get_data
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     response = self._http_request(path)
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 341, in _http_request
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     response = requests.request(method=method, url=url, data=data,
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base                                 headers=headers,
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base                                 verify=self._verify_https_request())
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\api.py", line 59, in request
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     return session.request(method=method, url=url, **kwargs)
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base            ~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\sessions.py", line 592, in request
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     resp = self.send(prep, **send_kwargs)
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\sessions.py", line 706, in send
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     r = adapter.send(request, **kwargs)
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\adapters.py", line 678, in send
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base     raise ConnectionError(e, request=request)
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base requests.exceptions.ConnectionError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /2009-04-04/meta-data/local-hostname (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:08:54.520 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:08:58.523 2904 DEBUG cloudbaseinit.metadata.services.base [-] Executing http request GET at http://169.254.169.254/2009-04-04/meta-data/local-hostname _http_request C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py:340
2026-07-05 04:08:58.524 2904 DEBUG urllib3.connectionpool [-] Starting new HTTP connection (1): 169.254.169.254:80 _new_conn C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py:241
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base [-] HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /2009-04-04/meta-data/local-hostname (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it")): requests.exceptions.ConnectionError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /2009-04-04/meta-data/local-hostname (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 204, in _new_conn
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     sock = connection.create_connection(
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base         (self._dns_host, self.port),
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     ...<2 lines>...
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base         socket_options=self.socket_options,
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\connection.py", line 85, in create_connection
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     raise err
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\connection.py", line 73, in create_connection
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     sock.connect(sa)
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^^^^
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base ConnectionRefusedError: [WinError 10061] No connection could be made because the target machine actively refused it
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base The above exception was the direct cause of the following exception:
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 787, in urlopen
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     response = self._make_request(
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base         conn,
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     ...<10 lines>...
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base         **response_kw,
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 493, in _make_request
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     conn.request(
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base         method,
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base         ^^^^^^^
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     ...<6 lines>...
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base         enforce_content_length=enforce_content_length,
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     ^
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 500, in request
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     self.endheaders()
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~~~~^^
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1353, in endheaders
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     self._send_output(message_body, encode_chunked=encode_chunked)
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1113, in _send_output
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     self.send(msg)
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~^^^^^
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1057, in send
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     self.connect()
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^^
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 331, in connect
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     self.sock = self._new_conn()
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base                 ~~~~~~~~~~~~~~^^
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 219, in _new_conn
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     raise NewConnectionError(
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base         self, f"Failed to establish a new connection: {e}"
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     ) from e
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base urllib3.exceptions.NewConnectionError: HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base The above exception was the direct cause of the following exception:
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\adapters.py", line 645, in send
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     resp = conn.urlopen(
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base         method=request.method,
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     ...<9 lines>...
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base         chunked=chunked,
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 841, in urlopen
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     retries = retries.increment(
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base         method, url, error=new_e, _pool=self, _stacktrace=sys.exc_info()[2]
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\retry.py", line 535, in increment
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     raise MaxRetryError(_pool, url, reason) from reason  # type: ignore[arg-type]
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base urllib3.exceptions.MaxRetryError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /2009-04-04/meta-data/local-hostname (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base During handling of the above exception, another exception occurred:
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 350, in _get_data
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     response = self._http_request(path)
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 341, in _http_request
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     response = requests.request(method=method, url=url, data=data,
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base                                 headers=headers,
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base                                 verify=self._verify_https_request())
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\api.py", line 59, in request
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     return session.request(method=method, url=url, **kwargs)
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base            ~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\sessions.py", line 592, in request
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     resp = self.send(prep, **send_kwargs)
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\sessions.py", line 706, in send
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     r = adapter.send(request, **kwargs)
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\adapters.py", line 678, in send
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base     raise ConnectionError(e, request=request)
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base requests.exceptions.ConnectionError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /2009-04-04/meta-data/local-hostname (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:09:00.584 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:09:04.588 2904 DEBUG cloudbaseinit.metadata.services.base [-] Executing http request GET at http://169.254.169.254/2009-04-04/meta-data/local-hostname _http_request C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py:340
2026-07-05 04:09:04.589 2904 DEBUG urllib3.connectionpool [-] Starting new HTTP connection (1): 169.254.169.254:80 _new_conn C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py:241
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base [-] HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /2009-04-04/meta-data/local-hostname (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it")): requests.exceptions.ConnectionError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /2009-04-04/meta-data/local-hostname (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 204, in _new_conn
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     sock = connection.create_connection(
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base         (self._dns_host, self.port),
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     ...<2 lines>...
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base         socket_options=self.socket_options,
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\connection.py", line 85, in create_connection
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     raise err
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\connection.py", line 73, in create_connection
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     sock.connect(sa)
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^^^^
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base ConnectionRefusedError: [WinError 10061] No connection could be made because the target machine actively refused it
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base The above exception was the direct cause of the following exception:
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 787, in urlopen
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     response = self._make_request(
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base         conn,
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     ...<10 lines>...
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base         **response_kw,
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 493, in _make_request
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     conn.request(
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base         method,
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base         ^^^^^^^
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     ...<6 lines>...
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base         enforce_content_length=enforce_content_length,
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     ^
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 500, in request
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     self.endheaders()
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~~~~^^
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1353, in endheaders
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     self._send_output(message_body, encode_chunked=encode_chunked)
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1113, in _send_output
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     self.send(msg)
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~^^^^^
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1057, in send
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     self.connect()
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^^
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 331, in connect
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     self.sock = self._new_conn()
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base                 ~~~~~~~~~~~~~~^^
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 219, in _new_conn
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     raise NewConnectionError(
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base         self, f"Failed to establish a new connection: {e}"
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     ) from e
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base urllib3.exceptions.NewConnectionError: HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base The above exception was the direct cause of the following exception:
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\adapters.py", line 645, in send
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     resp = conn.urlopen(
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base         method=request.method,
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     ...<9 lines>...
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base         chunked=chunked,
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 841, in urlopen
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     retries = retries.increment(
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base         method, url, error=new_e, _pool=self, _stacktrace=sys.exc_info()[2]
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\retry.py", line 535, in increment
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     raise MaxRetryError(_pool, url, reason) from reason  # type: ignore[arg-type]
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base urllib3.exceptions.MaxRetryError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /2009-04-04/meta-data/local-hostname (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base During handling of the above exception, another exception occurred:
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 350, in _get_data
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     response = self._http_request(path)
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 341, in _http_request
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     response = requests.request(method=method, url=url, data=data,
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base                                 headers=headers,
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base                                 verify=self._verify_https_request())
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\api.py", line 59, in request
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     return session.request(method=method, url=url, **kwargs)
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base            ~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\sessions.py", line 592, in request
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     resp = self.send(prep, **send_kwargs)
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\sessions.py", line 706, in send
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     r = adapter.send(request, **kwargs)
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\adapters.py", line 678, in send
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base     raise ConnectionError(e, request=request)
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base requests.exceptions.ConnectionError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /2009-04-04/meta-data/local-hostname (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:09:06.649 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:09:10.652 2904 DEBUG cloudbaseinit.metadata.services.base [-] Executing http request GET at http://169.254.169.254/2009-04-04/meta-data/local-hostname _http_request C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py:340
2026-07-05 04:09:10.653 2904 DEBUG urllib3.connectionpool [-] Starting new HTTP connection (1): 169.254.169.254:80 _new_conn C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py:241
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base [-] HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /2009-04-04/meta-data/local-hostname (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it")): requests.exceptions.ConnectionError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /2009-04-04/meta-data/local-hostname (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 204, in _new_conn
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     sock = connection.create_connection(
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base         (self._dns_host, self.port),
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     ...<2 lines>...
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base         socket_options=self.socket_options,
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\connection.py", line 85, in create_connection
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     raise err
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\connection.py", line 73, in create_connection
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     sock.connect(sa)
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^^^^
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base ConnectionRefusedError: [WinError 10061] No connection could be made because the target machine actively refused it
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base The above exception was the direct cause of the following exception:
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 787, in urlopen
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     response = self._make_request(
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base         conn,
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     ...<10 lines>...
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base         **response_kw,
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 493, in _make_request
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     conn.request(
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base         method,
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base         ^^^^^^^
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     ...<6 lines>...
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base         enforce_content_length=enforce_content_length,
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     ^
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 500, in request
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     self.endheaders()
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~~~~^^
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1353, in endheaders
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     self._send_output(message_body, encode_chunked=encode_chunked)
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1113, in _send_output
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     self.send(msg)
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~^^^^^
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1057, in send
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     self.connect()
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^^
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 331, in connect
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     self.sock = self._new_conn()
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base                 ~~~~~~~~~~~~~~^^
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 219, in _new_conn
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     raise NewConnectionError(
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base         self, f"Failed to establish a new connection: {e}"
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     ) from e
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base urllib3.exceptions.NewConnectionError: HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base The above exception was the direct cause of the following exception:
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\adapters.py", line 645, in send
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     resp = conn.urlopen(
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base         method=request.method,
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     ...<9 lines>...
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base         chunked=chunked,
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 841, in urlopen
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     retries = retries.increment(
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base         method, url, error=new_e, _pool=self, _stacktrace=sys.exc_info()[2]
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\retry.py", line 535, in increment
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     raise MaxRetryError(_pool, url, reason) from reason  # type: ignore[arg-type]
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base urllib3.exceptions.MaxRetryError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /2009-04-04/meta-data/local-hostname (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base During handling of the above exception, another exception occurred:
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 350, in _get_data
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     response = self._http_request(path)
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 341, in _http_request
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     response = requests.request(method=method, url=url, data=data,
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base                                 headers=headers,
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base                                 verify=self._verify_https_request())
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\api.py", line 59, in request
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     return session.request(method=method, url=url, **kwargs)
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base            ~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\sessions.py", line 592, in request
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     resp = self.send(prep, **send_kwargs)
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\sessions.py", line 706, in send
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     r = adapter.send(request, **kwargs)
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\adapters.py", line 678, in send
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base     raise ConnectionError(e, request=request)
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base requests.exceptions.ConnectionError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /2009-04-04/meta-data/local-hostname (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:09:12.713 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:09:16.717 2904 DEBUG cloudbaseinit.metadata.services.base [-] Executing http request GET at http://169.254.169.254/2009-04-04/meta-data/local-hostname _http_request C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py:340
2026-07-05 04:09:16.718 2904 DEBUG urllib3.connectionpool [-] Starting new HTTP connection (1): 169.254.169.254:80 _new_conn C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py:241
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base [-] HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /2009-04-04/meta-data/local-hostname (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it")): requests.exceptions.ConnectionError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /2009-04-04/meta-data/local-hostname (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 204, in _new_conn
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     sock = connection.create_connection(
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base         (self._dns_host, self.port),
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     ...<2 lines>...
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base         socket_options=self.socket_options,
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\connection.py", line 85, in create_connection
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     raise err
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\connection.py", line 73, in create_connection
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     sock.connect(sa)
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^^^^
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base ConnectionRefusedError: [WinError 10061] No connection could be made because the target machine actively refused it
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base The above exception was the direct cause of the following exception:
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 787, in urlopen
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     response = self._make_request(
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base         conn,
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     ...<10 lines>...
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base         **response_kw,
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 493, in _make_request
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     conn.request(
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base         method,
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base         ^^^^^^^
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     ...<6 lines>...
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base         enforce_content_length=enforce_content_length,
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     ^
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 500, in request
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     self.endheaders()
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~~~~^^
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1353, in endheaders
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     self._send_output(message_body, encode_chunked=encode_chunked)
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1113, in _send_output
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     self.send(msg)
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~^^^^^
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1057, in send
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     self.connect()
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^^
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 331, in connect
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     self.sock = self._new_conn()
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base                 ~~~~~~~~~~~~~~^^
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 219, in _new_conn
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     raise NewConnectionError(
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base         self, f"Failed to establish a new connection: {e}"
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     ) from e
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base urllib3.exceptions.NewConnectionError: HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base The above exception was the direct cause of the following exception:
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\adapters.py", line 645, in send
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     resp = conn.urlopen(
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base         method=request.method,
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     ...<9 lines>...
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base         chunked=chunked,
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 841, in urlopen
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     retries = retries.increment(
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base         method, url, error=new_e, _pool=self, _stacktrace=sys.exc_info()[2]
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\retry.py", line 535, in increment
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     raise MaxRetryError(_pool, url, reason) from reason  # type: ignore[arg-type]
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base urllib3.exceptions.MaxRetryError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /2009-04-04/meta-data/local-hostname (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base During handling of the above exception, another exception occurred:
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 350, in _get_data
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     response = self._http_request(path)
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 341, in _http_request
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     response = requests.request(method=method, url=url, data=data,
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base                                 headers=headers,
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base                                 verify=self._verify_https_request())
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\api.py", line 59, in request
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     return session.request(method=method, url=url, **kwargs)
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base            ~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\sessions.py", line 592, in request
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     resp = self.send(prep, **send_kwargs)
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\sessions.py", line 706, in send
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     r = adapter.send(request, **kwargs)
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\adapters.py", line 678, in send
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base     raise ConnectionError(e, request=request)
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base requests.exceptions.ConnectionError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /2009-04-04/meta-data/local-hostname (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:09:18.776 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service [-] HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /2009-04-04/meta-data/local-hostname (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it")): requests.exceptions.ConnectionError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /2009-04-04/meta-data/local-hostname (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service Traceback (most recent call last):
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 204, in _new_conn
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     sock = connection.create_connection(
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service         (self._dns_host, self.port),
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     ...<2 lines>...
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service         socket_options=self.socket_options,
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     )
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\connection.py", line 85, in create_connection
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     raise err
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\connection.py", line 73, in create_connection
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     sock.connect(sa)
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     ~~~~~~~~~~~~^^^^
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service ConnectionRefusedError: [WinError 10061] No connection could be made because the target machine actively refused it
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service 
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service The above exception was the direct cause of the following exception:
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service 
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service Traceback (most recent call last):
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 787, in urlopen
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     response = self._make_request(
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service         conn,
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     ...<10 lines>...
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service         **response_kw,
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     )
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 493, in _make_request
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     conn.request(
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     ~~~~~~~~~~~~^
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service         method,
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service         ^^^^^^^
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     ...<6 lines>...
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service         enforce_content_length=enforce_content_length,
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     )
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     ^
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 500, in request
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     self.endheaders()
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     ~~~~~~~~~~~~~~~^^
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1353, in endheaders
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     self._send_output(message_body, encode_chunked=encode_chunked)
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     ~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1113, in _send_output
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     self.send(msg)
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     ~~~~~~~~~^^^^^
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1057, in send
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     self.connect()
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     ~~~~~~~~~~~~^^
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 331, in connect
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     self.sock = self._new_conn()
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service                 ~~~~~~~~~~~~~~^^
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 219, in _new_conn
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     raise NewConnectionError(
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service         self, f"Failed to establish a new connection: {e}"
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     ) from e
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service urllib3.exceptions.NewConnectionError: HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service 
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service The above exception was the direct cause of the following exception:
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service 
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service Traceback (most recent call last):
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\adapters.py", line 645, in send
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     resp = conn.urlopen(
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service         method=request.method,
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     ...<9 lines>...
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service         chunked=chunked,
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     )
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 841, in urlopen
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     retries = retries.increment(
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service         method, url, error=new_e, _pool=self, _stacktrace=sys.exc_info()[2]
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     )
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\retry.py", line 535, in increment
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     raise MaxRetryError(_pool, url, reason) from reason  # type: ignore[arg-type]
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service urllib3.exceptions.MaxRetryError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /2009-04-04/meta-data/local-hostname (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service 
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service During handling of the above exception, another exception occurred:
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service 
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service Traceback (most recent call last):
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\ec2service.py", line 42, in load
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     self.get_host_name()
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     ~~~~~~~~~~~~~~~~~~^^
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\ec2service.py", line 51, in get_host_name
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     return self._get_cache_data('%s/meta-data/local-hostname' %
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service            ~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service                                 self._metadata_version, decode=True)
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service                                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 78, in _get_cache_data
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     data = self._exec_with_retry(lambda: self._get_data(path))
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 61, in _exec_with_retry
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     return action()
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 78, in <lambda>
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     data = self._exec_with_retry(lambda: self._get_data(path))
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service                                          ~~~~~~~~~~~~~~^^^^^^
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 350, in _get_data
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     response = self._http_request(path)
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 341, in _http_request
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     response = requests.request(method=method, url=url, data=data,
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service                                 headers=headers,
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service                                 verify=self._verify_https_request())
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\api.py", line 59, in request
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     return session.request(method=method, url=url, **kwargs)
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service            ~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\sessions.py", line 592, in request
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     resp = self.send(prep, **send_kwargs)
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\sessions.py", line 706, in send
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     r = adapter.send(request, **kwargs)
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\adapters.py", line 678, in send
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service     raise ConnectionError(e, request=request)
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service requests.exceptions.ConnectionError: HTTPConnectionPool(host='169.254.169.254', port=80): Max retries exceeded with url: /2009-04-04/meta-data/local-hostname (Caused by NewConnectionError("HTTPConnection(host='169.254.169.254', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:09:18.778 2904 ERROR cloudbaseinit.metadata.services.ec2service 
2026-07-05 04:09:18.787 2904 DEBUG cloudbaseinit.metadata.services.ec2service [-] Metadata not found at URL 'http://169.254.169.254/' load C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\ec2service.py:46
2026-07-05 04:09:18.787 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.metadata.services.maasservice.MaaSHttpService' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:09:18.819 2904 DEBUG cloudbaseinit.metadata.services.maasservice [-] MaaS metadata url not set load C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\maasservice.py:77
2026-07-05 04:09:18.819 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.metadata.services.cloudstack.CloudStack' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:09:18.832 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.osutils.windows.WindowsUtils' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:09:18.832 2904 DEBUG cloudbaseinit.metadata.services.base [-] Executing http request GET at http://10.1.1.1/latest/meta-data/service-offering _http_request C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py:340
2026-07-05 04:09:18.833 2904 DEBUG urllib3.connectionpool [-] Starting new HTTP connection (1): 10.1.1.1:80 _new_conn C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py:241
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base [-] HTTPConnectionPool(host='10.1.1.1', port=80): Max retries exceeded with url: /latest/meta-data/service-offering (Caused by NewConnectionError("HTTPConnection(host='10.1.1.1', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it")): requests.exceptions.ConnectionError: HTTPConnectionPool(host='10.1.1.1', port=80): Max retries exceeded with url: /latest/meta-data/service-offering (Caused by NewConnectionError("HTTPConnection(host='10.1.1.1', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 204, in _new_conn
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     sock = connection.create_connection(
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base         (self._dns_host, self.port),
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     ...<2 lines>...
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base         socket_options=self.socket_options,
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\connection.py", line 85, in create_connection
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     raise err
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\connection.py", line 73, in create_connection
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     sock.connect(sa)
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^^^^
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base ConnectionRefusedError: [WinError 10061] No connection could be made because the target machine actively refused it
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base The above exception was the direct cause of the following exception:
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 787, in urlopen
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     response = self._make_request(
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base         conn,
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     ...<10 lines>...
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base         **response_kw,
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 493, in _make_request
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     conn.request(
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base         method,
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base         ^^^^^^^
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     ...<6 lines>...
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base         enforce_content_length=enforce_content_length,
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     ^
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 500, in request
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     self.endheaders()
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~~~~^^
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1353, in endheaders
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     self._send_output(message_body, encode_chunked=encode_chunked)
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1113, in _send_output
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     self.send(msg)
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~^^^^^
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1057, in send
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     self.connect()
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^^
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 331, in connect
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     self.sock = self._new_conn()
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base                 ~~~~~~~~~~~~~~^^
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 219, in _new_conn
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     raise NewConnectionError(
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base         self, f"Failed to establish a new connection: {e}"
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     ) from e
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base urllib3.exceptions.NewConnectionError: HTTPConnection(host='10.1.1.1', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base The above exception was the direct cause of the following exception:
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\adapters.py", line 645, in send
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     resp = conn.urlopen(
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base         method=request.method,
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     ...<9 lines>...
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base         chunked=chunked,
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 841, in urlopen
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     retries = retries.increment(
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base         method, url, error=new_e, _pool=self, _stacktrace=sys.exc_info()[2]
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\retry.py", line 535, in increment
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     raise MaxRetryError(_pool, url, reason) from reason  # type: ignore[arg-type]
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base urllib3.exceptions.MaxRetryError: HTTPConnectionPool(host='10.1.1.1', port=80): Max retries exceeded with url: /latest/meta-data/service-offering (Caused by NewConnectionError("HTTPConnection(host='10.1.1.1', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base During handling of the above exception, another exception occurred:
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 350, in _get_data
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     response = self._http_request(path)
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 341, in _http_request
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     response = requests.request(method=method, url=url, data=data,
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base                                 headers=headers,
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base                                 verify=self._verify_https_request())
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\api.py", line 59, in request
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     return session.request(method=method, url=url, **kwargs)
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base            ~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\sessions.py", line 592, in request
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     resp = self.send(prep, **send_kwargs)
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\sessions.py", line 706, in send
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     r = adapter.send(request, **kwargs)
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\adapters.py", line 678, in send
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base     raise ConnectionError(e, request=request)
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base requests.exceptions.ConnectionError: HTTPConnectionPool(host='10.1.1.1', port=80): Max retries exceeded with url: /latest/meta-data/service-offering (Caused by NewConnectionError("HTTPConnection(host='10.1.1.1', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:09:39.856 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:09:39.860 2904 DEBUG cloudbaseinit.metadata.services.cloudstack [-] Something went wrong. _test_api C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\cloudstack.py:75
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack [-] HTTPConnectionPool(host='10.1.1.1', port=80): Max retries exceeded with url: /latest/meta-data/service-offering (Caused by NewConnectionError("HTTPConnection(host='10.1.1.1', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it")): requests.exceptions.ConnectionError: HTTPConnectionPool(host='10.1.1.1', port=80): Max retries exceeded with url: /latest/meta-data/service-offering (Caused by NewConnectionError("HTTPConnection(host='10.1.1.1', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack Traceback (most recent call last):
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 204, in _new_conn
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     sock = connection.create_connection(
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack         (self._dns_host, self.port),
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     ...<2 lines>...
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack         socket_options=self.socket_options,
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     )
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\connection.py", line 85, in create_connection
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     raise err
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\connection.py", line 73, in create_connection
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     sock.connect(sa)
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     ~~~~~~~~~~~~^^^^
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack ConnectionRefusedError: [WinError 10061] No connection could be made because the target machine actively refused it
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack 
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack The above exception was the direct cause of the following exception:
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack 
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack Traceback (most recent call last):
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 787, in urlopen
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     response = self._make_request(
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack         conn,
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     ...<10 lines>...
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack         **response_kw,
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     )
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 493, in _make_request
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     conn.request(
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     ~~~~~~~~~~~~^
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack         method,
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack         ^^^^^^^
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     ...<6 lines>...
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack         enforce_content_length=enforce_content_length,
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     )
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     ^
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 500, in request
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     self.endheaders()
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     ~~~~~~~~~~~~~~~^^
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1353, in endheaders
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     self._send_output(message_body, encode_chunked=encode_chunked)
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     ~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1113, in _send_output
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     self.send(msg)
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     ~~~~~~~~~^^^^^
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1057, in send
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     self.connect()
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     ~~~~~~~~~~~~^^
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 331, in connect
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     self.sock = self._new_conn()
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack                 ~~~~~~~~~~~~~~^^
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 219, in _new_conn
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     raise NewConnectionError(
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack         self, f"Failed to establish a new connection: {e}"
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     ) from e
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack urllib3.exceptions.NewConnectionError: HTTPConnection(host='10.1.1.1', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack 
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack The above exception was the direct cause of the following exception:
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack 
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack Traceback (most recent call last):
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\adapters.py", line 645, in send
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     resp = conn.urlopen(
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack         method=request.method,
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     ...<9 lines>...
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack         chunked=chunked,
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     )
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 841, in urlopen
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     retries = retries.increment(
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack         method, url, error=new_e, _pool=self, _stacktrace=sys.exc_info()[2]
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     )
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\retry.py", line 535, in increment
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     raise MaxRetryError(_pool, url, reason) from reason  # type: ignore[arg-type]
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack urllib3.exceptions.MaxRetryError: HTTPConnectionPool(host='10.1.1.1', port=80): Max retries exceeded with url: /latest/meta-data/service-offering (Caused by NewConnectionError("HTTPConnection(host='10.1.1.1', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack 
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack During handling of the above exception, another exception occurred:
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack 
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack Traceback (most recent call last):
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\cloudstack.py", line 67, in _test_api
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     response = self._get_data(self._get_path("service-offering"))
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 350, in _get_data
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     response = self._http_request(path)
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 341, in _http_request
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     response = requests.request(method=method, url=url, data=data,
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack                                 headers=headers,
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack                                 verify=self._verify_https_request())
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\api.py", line 59, in request
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     return session.request(method=method, url=url, **kwargs)
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack            ~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\sessions.py", line 592, in request
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     resp = self.send(prep, **send_kwargs)
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\sessions.py", line 706, in send
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     r = adapter.send(request, **kwargs)
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\adapters.py", line 678, in send
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack     raise ConnectionError(e, request=request)
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack requests.exceptions.ConnectionError: HTTPConnectionPool(host='10.1.1.1', port=80): Max retries exceeded with url: /latest/meta-data/service-offering (Caused by NewConnectionError("HTTPConnection(host='10.1.1.1', port=80): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))
2026-07-05 04:09:39.860 2904 ERROR cloudbaseinit.metadata.services.cloudstack 
2026-07-05 04:09:39.864 2904 DEBUG cloudbaseinit.metadata.services.cloudstack [-] Testing: 192.168.200.254 load C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\cloudstack.py:99
2026-07-05 04:09:39.864 2904 DEBUG cloudbaseinit.metadata.services.base [-] Executing http request GET at http://192.168.200.254/latest/meta-data/service-offering _http_request C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py:340
2026-07-05 04:09:39.865 2904 DEBUG urllib3.connectionpool [-] Starting new HTTP connection (1): 192.168.200.254:80 _new_conn C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py:241
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base [-] HTTPConnectionPool(host='192.168.200.254', port=80): Max retries exceeded with url: /latest/meta-data/service-offering (Caused by ConnectTimeoutError(<HTTPConnection(host='192.168.200.254', port=80) at 0x2662762f350>, 'Connection to 192.168.200.254 timed out. (connect timeout=None)')): requests.exceptions.ConnectTimeout: HTTPConnectionPool(host='192.168.200.254', port=80): Max retries exceeded with url: /latest/meta-data/service-offering (Caused by ConnectTimeoutError(<HTTPConnection(host='192.168.200.254', port=80) at 0x2662762f350>, 'Connection to 192.168.200.254 timed out. (connect timeout=None)'))
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 204, in _new_conn
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     sock = connection.create_connection(
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base         (self._dns_host, self.port),
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     ...<2 lines>...
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base         socket_options=self.socket_options,
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\connection.py", line 85, in create_connection
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     raise err
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\connection.py", line 73, in create_connection
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     sock.connect(sa)
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^^^^
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base TimeoutError: [WinError 10060] A connection attempt failed because the connected party did not properly respond after a period of time, or established connection failed because connected host has failed to respond
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base The above exception was the direct cause of the following exception:
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 787, in urlopen
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     response = self._make_request(
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base         conn,
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     ...<10 lines>...
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base         **response_kw,
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 493, in _make_request
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     conn.request(
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base         method,
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base         ^^^^^^^
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     ...<6 lines>...
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base         enforce_content_length=enforce_content_length,
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     ^
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 500, in request
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     self.endheaders()
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~~~~^^
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1353, in endheaders
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     self._send_output(message_body, encode_chunked=encode_chunked)
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1113, in _send_output
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     self.send(msg)
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~^^^^^
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1057, in send
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     self.connect()
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     ~~~~~~~~~~~~^^
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 331, in connect
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     self.sock = self._new_conn()
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base                 ~~~~~~~~~~~~~~^^
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 213, in _new_conn
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     raise ConnectTimeoutError(
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     ...<2 lines>...
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     ) from e
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base urllib3.exceptions.ConnectTimeoutError: (<HTTPConnection(host='192.168.200.254', port=80) at 0x2662762f350>, 'Connection to 192.168.200.254 timed out. (connect timeout=None)')
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base The above exception was the direct cause of the following exception:
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\adapters.py", line 645, in send
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     resp = conn.urlopen(
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base         method=request.method,
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     ...<9 lines>...
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base         chunked=chunked,
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 841, in urlopen
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     retries = retries.increment(
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base         method, url, error=new_e, _pool=self, _stacktrace=sys.exc_info()[2]
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     )
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\retry.py", line 535, in increment
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     raise MaxRetryError(_pool, url, reason) from reason  # type: ignore[arg-type]
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base urllib3.exceptions.MaxRetryError: HTTPConnectionPool(host='192.168.200.254', port=80): Max retries exceeded with url: /latest/meta-data/service-offering (Caused by ConnectTimeoutError(<HTTPConnection(host='192.168.200.254', port=80) at 0x2662762f350>, 'Connection to 192.168.200.254 timed out. (connect timeout=None)'))
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base During handling of the above exception, another exception occurred:
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base Traceback (most recent call last):
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 350, in _get_data
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     response = self._http_request(path)
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 341, in _http_request
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     response = requests.request(method=method, url=url, data=data,
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base                                 headers=headers,
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base                                 verify=self._verify_https_request())
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\api.py", line 59, in request
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     return session.request(method=method, url=url, **kwargs)
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base            ~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\sessions.py", line 592, in request
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     resp = self.send(prep, **send_kwargs)
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\sessions.py", line 706, in send
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     r = adapter.send(request, **kwargs)
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\adapters.py", line 666, in send
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base     raise ConnectTimeout(e, request=request)
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base requests.exceptions.ConnectTimeout: HTTPConnectionPool(host='192.168.200.254', port=80): Max retries exceeded with url: /latest/meta-data/service-offering (Caused by ConnectTimeoutError(<HTTPConnection(host='192.168.200.254', port=80) at 0x2662762f350>, 'Connection to 192.168.200.254 timed out. (connect timeout=None)'))
2026-07-05 04:10:00.915 2904 ERROR cloudbaseinit.metadata.services.base 
2026-07-05 04:10:00.917 2904 DEBUG cloudbaseinit.metadata.services.cloudstack [-] Something went wrong. _test_api C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\cloudstack.py:75
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack [-] HTTPConnectionPool(host='192.168.200.254', port=80): Max retries exceeded with url: /latest/meta-data/service-offering (Caused by ConnectTimeoutError(<HTTPConnection(host='192.168.200.254', port=80) at 0x2662762f350>, 'Connection to 192.168.200.254 timed out. (connect timeout=None)')): requests.exceptions.ConnectTimeout: HTTPConnectionPool(host='192.168.200.254', port=80): Max retries exceeded with url: /latest/meta-data/service-offering (Caused by ConnectTimeoutError(<HTTPConnection(host='192.168.200.254', port=80) at 0x2662762f350>, 'Connection to 192.168.200.254 timed out. (connect timeout=None)'))
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack Traceback (most recent call last):
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 204, in _new_conn
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     sock = connection.create_connection(
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack         (self._dns_host, self.port),
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     ...<2 lines>...
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack         socket_options=self.socket_options,
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     )
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\connection.py", line 85, in create_connection
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     raise err
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\connection.py", line 73, in create_connection
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     sock.connect(sa)
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     ~~~~~~~~~~~~^^^^
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack TimeoutError: [WinError 10060] A connection attempt failed because the connected party did not properly respond after a period of time, or established connection failed because connected host has failed to respond
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack 
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack The above exception was the direct cause of the following exception:
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack 
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack Traceback (most recent call last):
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 787, in urlopen
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     response = self._make_request(
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack         conn,
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     ...<10 lines>...
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack         **response_kw,
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     )
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 493, in _make_request
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     conn.request(
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     ~~~~~~~~~~~~^
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack         method,
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack         ^^^^^^^
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     ...<6 lines>...
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack         enforce_content_length=enforce_content_length,
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     )
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     ^
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 500, in request
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     self.endheaders()
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     ~~~~~~~~~~~~~~~^^
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1353, in endheaders
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     self._send_output(message_body, encode_chunked=encode_chunked)
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     ~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1113, in _send_output
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     self.send(msg)
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     ~~~~~~~~~^^^^^
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\http\client.py", line 1057, in send
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     self.connect()
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     ~~~~~~~~~~~~^^
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 331, in connect
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     self.sock = self._new_conn()
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack                 ~~~~~~~~~~~~~~^^
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connection.py", line 213, in _new_conn
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     raise ConnectTimeoutError(
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     ...<2 lines>...
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     ) from e
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack urllib3.exceptions.ConnectTimeoutError: (<HTTPConnection(host='192.168.200.254', port=80) at 0x2662762f350>, 'Connection to 192.168.200.254 timed out. (connect timeout=None)')
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack 
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack The above exception was the direct cause of the following exception:
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack 
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack Traceback (most recent call last):
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\adapters.py", line 645, in send
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     resp = conn.urlopen(
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack         method=request.method,
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     ...<9 lines>...
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack         chunked=chunked,
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     )
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\connectionpool.py", line 841, in urlopen
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     retries = retries.increment(
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack         method, url, error=new_e, _pool=self, _stacktrace=sys.exc_info()[2]
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     )
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\urllib3\util\retry.py", line 535, in increment
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     raise MaxRetryError(_pool, url, reason) from reason  # type: ignore[arg-type]
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack urllib3.exceptions.MaxRetryError: HTTPConnectionPool(host='192.168.200.254', port=80): Max retries exceeded with url: /latest/meta-data/service-offering (Caused by ConnectTimeoutError(<HTTPConnection(host='192.168.200.254', port=80) at 0x2662762f350>, 'Connection to 192.168.200.254 timed out. (connect timeout=None)'))
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack 
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack During handling of the above exception, another exception occurred:
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack 
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack Traceback (most recent call last):
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\cloudstack.py", line 67, in _test_api
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     response = self._get_data(self._get_path("service-offering"))
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 350, in _get_data
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     response = self._http_request(path)
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\base.py", line 341, in _http_request
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     response = requests.request(method=method, url=url, data=data,
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack                                 headers=headers,
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack                                 verify=self._verify_https_request())
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\api.py", line 59, in request
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     return session.request(method=method, url=url, **kwargs)
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack            ~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\sessions.py", line 592, in request
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     resp = self.send(prep, **send_kwargs)
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\sessions.py", line 706, in send
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     r = adapter.send(request, **kwargs)
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\requests\adapters.py", line 666, in send
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack     raise ConnectTimeout(e, request=request)
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack requests.exceptions.ConnectTimeout: HTTPConnectionPool(host='192.168.200.254', port=80): Max retries exceeded with url: /latest/meta-data/service-offering (Caused by ConnectTimeoutError(<HTTPConnection(host='192.168.200.254', port=80) at 0x2662762f350>, 'Connection to 192.168.200.254 timed out. (connect timeout=None)'))
2026-07-05 04:10:00.918 2904 ERROR cloudbaseinit.metadata.services.cloudstack 
2026-07-05 04:10:00.920 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.metadata.services.opennebulaservice.OpenNebulaService' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:10:00.930 2904 DEBUG cloudbaseinit.metadata.services.opennebulaservice [-] Searching for a drive containing OpenNebula context data load C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\metadata\services\opennebulaservice.py:175
2026-07-05 04:10:00.930 2904 DEBUG cloudbaseinit.utils.classloader [-] Loading class 'cloudbaseinit.osutils.windows.WindowsUtils' load_class C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\classloader.py:35
2026-07-05 04:10:00.932 2904 ERROR cloudbaseinit.metadata.services.opennebulaservice [-] No drive or context file found
2026-07-05 04:10:00.932 2904 ERROR cloudbaseinit.init [-] No metadata service found: cloudbaseinit.exception.MetadataNotFoundException: No available service found
2026-07-05 04:10:00.933 2904 INFO cloudbaseinit.init [-] Plugins execution done
2026-07-05 04:10:00.933 2904 INFO cloudbaseinit.init [-] Stopping Cloudbase-Init service
2026-07-05 04:10:03.934 2904 DEBUG cloudbaseinit.osutils.windows [-] Stopping service cloudbase-init stop_service C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\osutils\windows.py:1169
2026-07-05 18:27:27.465 3048 INFO cloudbaseinit.osutils.windows [-] Skipping password reset, service running as a built-in account: LocalSystem
2026-07-05 18:27:27.469 3048 INFO cloudbaseinit.init [-] Cloudbase-Init version: 1.1.8
2026-07-05 18:27:28.471 3048 INFO cloudbaseinit.osutils.windows [-] Waiting for sysprep completion. GeneralizationState: 4
2026-07-05 18:27:29.472 3048 INFO cloudbaseinit.osutils.windows [-] Waiting for sysprep completion. GeneralizationState: 4
2026-07-05 18:27:30.473 3048 INFO cloudbaseinit.osutils.windows [-] Waiting for sysprep completion. GeneralizationState: 4
2026-07-05 18:27:31.474 3048 INFO cloudbaseinit.osutils.windows [-] Waiting for sysprep completion. GeneralizationState: 4
2026-07-05 18:27:32.476 3048 INFO cloudbaseinit.osutils.windows [-] Waiting for sysprep completion. GeneralizationState: 4
2026-07-05 18:27:33.477 3048 INFO cloudbaseinit.osutils.windows [-] Waiting for sysprep completion. GeneralizationState: 4
2026-07-05 18:27:34.479 3048 INFO cloudbaseinit.osutils.windows [-] Waiting for sysprep completion. GeneralizationState: 4
2026-07-05 18:27:35.480 3048 INFO cloudbaseinit.osutils.windows [-] Waiting for sysprep completion. GeneralizationState: 4
2026-07-05 18:27:35.673 3048 INFO cloudbaseinit.init [-] Executing plugins for stage 'PRE_NETWORKING':
2026-07-05 18:27:35.673 3048 INFO cloudbaseinit.init [-] Executing plugins for stage 'PRE_METADATA_DISCOVERY':
2026-07-05 18:27:35.674 3048 INFO cloudbaseinit.init [-] Executing plugin 'MTUPlugin'
2026-07-05 18:27:35.703 3048 WARNING cloudbaseinit.metadata.services.osconfigdrive.windows [-] ISO extraction failed on <Partition: \\?\GLOBALROOT\Device\Harddisk0\Partition1> with WindowsCloudbaseInitException("Cannot open file: 'The process cannot access the file because it is being used by another process.'"): cloudbaseinit.exception.WindowsCloudbaseInitException: Cannot open file: 'The process cannot access the file because it is being used by another process.'
2026-07-05 18:27:35.928 3048 WARNING cloudbaseinit.metadata.services.osconfigdrive.windows [-] ISO extraction failed on <Partition: \\?\GLOBALROOT\Device\Harddisk0\Partition3> with WindowsCloudbaseInitException("Cannot open file: 'The process cannot access the file because it is being used by another process.'"): cloudbaseinit.exception.WindowsCloudbaseInitException: Cannot open file: 'The process cannot access the file because it is being used by another process.'
2026-07-05 18:27:36.340 3048 INFO cloudbaseinit.metadata.services.osconfigdrive.windows [-] Config Drive found on E:\
2026-07-05 18:27:36.383 3048 INFO cloudbaseinit.init [-] Metadata service loaded: 'ConfigDriveService'
2026-07-05 18:27:36.385 3048 INFO cloudbaseinit.init [-] Executing plugins for stage 'MAIN':
2026-07-05 18:27:36.385 3048 INFO cloudbaseinit.init [-] Executing plugin 'SetHostNamePlugin'
2026-07-05 18:27:36.386 3048 INFO cloudbaseinit.init [-] Executing plugin 'CreateUserPlugin'
2026-07-05 18:27:36.404 3048 INFO cloudbaseinit.plugins.common.createuser [-] Creating user "sysuser" and setting password
2026-07-05 18:27:37.360 3916 INFO cloudbaseinit.osutils.windows [-] Skipping password reset, service running as a built-in account: LocalSystem
2026-07-05 18:27:37.366 3916 INFO cloudbaseinit.init [-] Cloudbase-Init version: 1.1.8
2026-07-05 18:27:37.462 3916 INFO cloudbaseinit.init [-] Executing plugins for stage 'PRE_NETWORKING':
2026-07-05 18:27:37.462 3916 INFO cloudbaseinit.init [-] Executing plugins for stage 'PRE_METADATA_DISCOVERY':
2026-07-05 18:27:37.462 3916 INFO cloudbaseinit.init [-] Executing plugin 'MTUPlugin'
2026-07-05 18:27:37.484 3916 WARNING cloudbaseinit.metadata.services.osconfigdrive.windows [-] ISO extraction failed on <Partition: \\?\GLOBALROOT\Device\Harddisk0\Partition1> with WindowsCloudbaseInitException("Cannot open file: 'The process cannot access the file because it is being used by another process.'"): cloudbaseinit.exception.WindowsCloudbaseInitException: Cannot open file: 'The process cannot access the file because it is being used by another process.'
2026-07-05 18:27:37.609 3916 WARNING cloudbaseinit.metadata.services.osconfigdrive.windows [-] ISO extraction failed on <Partition: \\?\GLOBALROOT\Device\Harddisk0\Partition3> with WindowsCloudbaseInitException("Cannot open file: 'The process cannot access the file because it is being used by another process.'"): cloudbaseinit.exception.WindowsCloudbaseInitException: Cannot open file: 'The process cannot access the file because it is being used by another process.'
2026-07-05 18:27:37.616 3916 INFO cloudbaseinit.metadata.services.osconfigdrive.windows [-] Config Drive found on E:\
2026-07-05 18:27:37.626 3916 INFO cloudbaseinit.init [-] Metadata service loaded: 'ConfigDriveService'
2026-07-05 18:27:37.627 3916 INFO cloudbaseinit.init [-] Executing plugins for stage 'MAIN':
2026-07-05 18:27:37.628 3916 INFO cloudbaseinit.init [-] Executing plugin 'CreateUserPlugin'
2026-07-05 18:27:37.629 3916 INFO cloudbaseinit.plugins.common.createuser [-] Setting password for existing user "sysuser"
2026-07-05 18:27:50.634 3048 ERROR cloudbaseinit.plugins.windows.createuser [-] Cannot create a user logon session for user: "sysuser": cloudbaseinit.exception.WindowsCloudbaseInitException: User logon failed: 'The user name or password is incorrect.'
2026-07-05 18:27:50.634 3048 ERROR cloudbaseinit.plugins.windows.createuser Traceback (most recent call last):
2026-07-05 18:27:50.634 3048 ERROR cloudbaseinit.plugins.windows.createuser   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\plugins\windows\createuser.py", line 30, in _create_user_logon
2026-07-05 18:27:50.634 3048 ERROR cloudbaseinit.plugins.windows.createuser     token = osutils.create_user_logon_session(user_name,
2026-07-05 18:27:50.634 3048 ERROR cloudbaseinit.plugins.windows.createuser                                               password,
2026-07-05 18:27:50.634 3048 ERROR cloudbaseinit.plugins.windows.createuser                                               True)
2026-07-05 18:27:50.634 3048 ERROR cloudbaseinit.plugins.windows.createuser   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\retry_decorator.py", line 47, in inner
2026-07-05 18:27:50.634 3048 ERROR cloudbaseinit.plugins.windows.createuser     return f(*args, **kwargs)
2026-07-05 18:27:50.634 3048 ERROR cloudbaseinit.plugins.windows.createuser   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\osutils\windows.py", line 661, in create_user_logon_session
2026-07-05 18:27:50.634 3048 ERROR cloudbaseinit.plugins.windows.createuser     raise exception.WindowsCloudbaseInitException(
2026-07-05 18:27:50.634 3048 ERROR cloudbaseinit.plugins.windows.createuser         "User logon failed: %r")
2026-07-05 18:27:50.634 3048 ERROR cloudbaseinit.plugins.windows.createuser cloudbaseinit.exception.WindowsCloudbaseInitException: User logon failed: 'The user name or password is incorrect.'
2026-07-05 18:27:50.634 3048 ERROR cloudbaseinit.plugins.windows.createuser 
2026-07-05 18:27:50.661 3048 INFO cloudbaseinit.init [-] Executing plugin 'SetUserPasswordPlugin'
2026-07-05 18:27:50.662 3048 WARNING cloudbaseinit.plugins.common.setuserpassword [-] Using admin_pass metadata user password. Consider changing it as soon as possible
2026-07-05 18:27:50.676 3048 INFO cloudbaseinit.plugins.common.setuserpassword [-] Password succesfully updated for user sysuser
2026-07-05 18:27:50.676 3048 INFO cloudbaseinit.plugins.common.setuserpassword [-] Cannot set the password in the metadata as it is not supported by this service
2026-07-05 18:27:50.677 3048 INFO cloudbaseinit.init [-] Executing plugin 'NetworkConfigPlugin'
2026-07-05 18:27:50.677 3048 INFO cloudbaseinit.metadata.services.baseopenstackservice [-] V2 network metadata not found
2026-07-05 18:27:50.679 3048 INFO cloudbaseinit.utils.debiface [-] Parsing Debian config...
auto eth0
iface eth0 inet dhcp

2026-07-05 18:27:50.679 3048 INFO cloudbaseinit.init [-] Executing plugin 'ExtendVolumesPlugin'
2026-07-05 18:27:51.135 3048 INFO comtypes.client._code_cache [-] Could not import comtypes.gen, trying to create it.
2026-07-05 18:27:51.136 3048 INFO comtypes.client._code_cache [-] Created comtypes.gen directory: 'C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\comtypes\gen'
2026-07-05 18:27:51.137 3048 INFO comtypes.client._code_cache [-] Writing __init__.py file: 'C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\comtypes\gen\__init__.py'
2026-07-05 18:27:51.141 3048 INFO comtypes.client._code_cache [-] Using writeable comtypes cache directory: 'C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\comtypes\gen'
2026-07-05 18:27:51.640 3916 ERROR cloudbaseinit.plugins.windows.createuser [-] Cannot create a user logon session for user: "sysuser": cloudbaseinit.exception.WindowsCloudbaseInitException: User logon failed: 'The user name or password is incorrect.'
2026-07-05 18:27:51.640 3916 ERROR cloudbaseinit.plugins.windows.createuser Traceback (most recent call last):
2026-07-05 18:27:51.640 3916 ERROR cloudbaseinit.plugins.windows.createuser   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\plugins\windows\createuser.py", line 30, in _create_user_logon
2026-07-05 18:27:51.640 3916 ERROR cloudbaseinit.plugins.windows.createuser     token = osutils.create_user_logon_session(user_name,
2026-07-05 18:27:51.640 3916 ERROR cloudbaseinit.plugins.windows.createuser                                               password,
2026-07-05 18:27:51.640 3916 ERROR cloudbaseinit.plugins.windows.createuser                                               True)
2026-07-05 18:27:51.640 3916 ERROR cloudbaseinit.plugins.windows.createuser   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\utils\retry_decorator.py", line 47, in inner
2026-07-05 18:27:51.640 3916 ERROR cloudbaseinit.plugins.windows.createuser     return f(*args, **kwargs)
2026-07-05 18:27:51.640 3916 ERROR cloudbaseinit.plugins.windows.createuser   File "C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\cloudbaseinit\osutils\windows.py", line 661, in create_user_logon_session
2026-07-05 18:27:51.640 3916 ERROR cloudbaseinit.plugins.windows.createuser     raise exception.WindowsCloudbaseInitException(
2026-07-05 18:27:51.640 3916 ERROR cloudbaseinit.plugins.windows.createuser         "User logon failed: %r")
2026-07-05 18:27:51.640 3916 ERROR cloudbaseinit.plugins.windows.createuser cloudbaseinit.exception.WindowsCloudbaseInitException: User logon failed: 'The user name or password is incorrect.'
2026-07-05 18:27:51.640 3916 ERROR cloudbaseinit.plugins.windows.createuser 
2026-07-05 18:27:51.643 3916 INFO cloudbaseinit.init [-] Executing plugin 'ExtendVolumesPlugin'
2026-07-05 18:27:51.676 3916 INFO comtypes.client._code_cache [-] Imported existing <module 'comtypes.gen' from 'C:\\Program Files\\Cloudbase Solutions\\Cloudbase-Init\\Python\\Lib\\site-packages\\comtypes\\gen\\__init__.py'>
2026-07-05 18:27:51.677 3916 INFO comtypes.client._code_cache [-] Using writeable comtypes cache directory: 'C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\comtypes\gen'
2026-07-05 18:27:52.426 3916 INFO cloudbaseinit.init [-] Executing plugin 'UserDataPlugin'
2026-07-05 18:27:52.426 3048 INFO cloudbaseinit.init [-] Executing plugin 'UserDataPlugin'
2026-07-05 18:27:53.048 3916 INFO cloudbaseinit.plugins.common.userdataplugins.cloudconfigplugins.set_hostname [-] Changing hostname to 'win-verify'
2026-07-05 18:27:53.049 3048 INFO cloudbaseinit.plugins.common.userdataplugins.cloudconfigplugins.set_hostname [-] Changing hostname to 'win-verify'
2026-07-05 18:27:53.171 3916 INFO cloudbaseinit.utils.hostname [-] Setting hostname: win-verify
2026-07-05 18:27:53.177 3048 INFO cloudbaseinit.utils.hostname [-] Setting hostname: win-verify
2026-07-05 18:27:53.179 3916 ERROR cloudbaseinit.plugins.common.userdataplugins.cloudconfig [-] Plugin 'manage_etc_hosts' is currently not supported
2026-07-05 18:27:53.179 3048 ERROR cloudbaseinit.plugins.common.userdataplugins.cloudconfig [-] Plugin 'manage_etc_hosts' is currently not supported
2026-07-05 18:27:53.179 3048 ERROR cloudbaseinit.plugins.common.userdataplugins.cloudconfig [-] Plugin 'fqdn' is currently not supported
2026-07-05 18:27:53.179 3916 ERROR cloudbaseinit.plugins.common.userdataplugins.cloudconfig [-] Plugin 'fqdn' is currently not supported
2026-07-05 18:27:53.180 3048 ERROR cloudbaseinit.plugins.common.userdataplugins.cloudconfig [-] Plugin 'user' is currently not supported
2026-07-05 18:27:53.180 3916 ERROR cloudbaseinit.plugins.common.userdataplugins.cloudconfig [-] Plugin 'user' is currently not supported
2026-07-05 18:27:53.180 3916 ERROR cloudbaseinit.plugins.common.userdataplugins.cloudconfig [-] Plugin 'password' is currently not supported
2026-07-05 18:27:53.180 3048 ERROR cloudbaseinit.plugins.common.userdataplugins.cloudconfig [-] Plugin 'password' is currently not supported
2026-07-05 18:27:53.180 3048 ERROR cloudbaseinit.plugins.common.userdataplugins.cloudconfig [-] Plugin 'chpasswd' is currently not supported
2026-07-05 18:27:53.180 3916 ERROR cloudbaseinit.plugins.common.userdataplugins.cloudconfig [-] Plugin 'chpasswd' is currently not supported
2026-07-05 18:27:53.180 3048 ERROR cloudbaseinit.plugins.common.userdataplugins.cloudconfig [-] Plugin 'package_upgrade' is currently not supported
2026-07-05 18:27:53.180 3916 ERROR cloudbaseinit.plugins.common.userdataplugins.cloudconfig [-] Plugin 'package_upgrade' is currently not supported
2026-07-05 18:27:53.181 3916 INFO cloudbaseinit.init [-] Plugins execution done
2026-07-05 18:27:53.181 3048 INFO cloudbaseinit.init [-] Plugins execution done
2026-07-05 18:28:30.161 3320 INFO cloudbaseinit.osutils.windows [-] Skipping password reset, service running as a built-in account: LocalSystem
2026-07-05 18:28:30.164 3320 INFO cloudbaseinit.init [-] Cloudbase-Init version: 1.1.8
2026-07-05 18:28:30.326 3320 INFO cloudbaseinit.init [-] Executing plugins for stage 'PRE_NETWORKING':
2026-07-05 18:28:30.326 3320 INFO cloudbaseinit.init [-] Executing plugins for stage 'PRE_METADATA_DISCOVERY':
2026-07-05 18:28:30.326 3320 INFO cloudbaseinit.init [-] Executing plugin 'MTUPlugin'
2026-07-05 18:28:30.354 3320 INFO cloudbaseinit.metadata.services.osconfigdrive.windows [-] Config Drive found on \\?\Volume{ce22996b-78d9-11f1-b640-806e6f6e6963}\
2026-07-05 18:28:30.367 3320 INFO cloudbaseinit.init [-] Metadata service loaded: 'ConfigDriveService'
2026-07-05 18:28:30.368 3320 INFO cloudbaseinit.init [-] Executing plugins for stage 'MAIN':
2026-07-05 18:28:30.369 3320 INFO cloudbaseinit.init [-] Executing plugin 'ExtendVolumesPlugin'
2026-07-05 18:28:30.456 3320 INFO comtypes.client._code_cache [-] Imported existing <module 'comtypes.gen' from 'C:\\Program Files\\Cloudbase Solutions\\Cloudbase-Init\\Python\\Lib\\site-packages\\comtypes\\gen\\__init__.py'>
2026-07-05 18:28:30.457 3320 INFO comtypes.client._code_cache [-] Using writeable comtypes cache directory: 'C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Lib\site-packages\comtypes\gen'
2026-07-05 18:28:34.087 3320 INFO cloudbaseinit.init [-] Executing plugin 'UserDataPlugin'
2026-07-05 18:28:34.268 3320 INFO cloudbaseinit.plugins.common.userdataplugins.cloudconfigplugins.set_hostname [-] Changing hostname to 'win-verify'
2026-07-05 18:28:38.479 3320 ERROR cloudbaseinit.plugins.common.userdataplugins.cloudconfig [-] Plugin 'manage_etc_hosts' is currently not supported
2026-07-05 18:28:38.480 3320 ERROR cloudbaseinit.plugins.common.userdataplugins.cloudconfig [-] Plugin 'fqdn' is currently not supported
2026-07-05 18:28:38.480 3320 ERROR cloudbaseinit.plugins.common.userdataplugins.cloudconfig [-] Plugin 'user' is currently not supported
2026-07-05 18:28:38.480 3320 ERROR cloudbaseinit.plugins.common.userdataplugins.cloudconfig [-] Plugin 'password' is currently not supported
2026-07-05 18:28:38.480 3320 ERROR cloudbaseinit.plugins.common.userdataplugins.cloudconfig [-] Plugin 'chpasswd' is currently not supported
2026-07-05 18:28:38.480 3320 ERROR cloudbaseinit.plugins.common.userdataplugins.cloudconfig [-] Plugin 'package_upgrade' is currently not supported
2026-07-05 18:28:38.481 3320 INFO cloudbaseinit.init [-] Plugins execution done
