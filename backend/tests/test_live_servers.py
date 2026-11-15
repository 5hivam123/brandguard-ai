import subprocess
import time
import urllib.request
import json
import os

def test_live_servers():
    print("Testing live servers startup and integration...")
    # Disable proxy for localhost in urllib
    urllib.request.install_opener(urllib.request.build_opener(urllib.request.ProxyHandler({})))

    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    backend_dir = os.path.join(base_dir, "backend")
    frontend_dir = os.path.join(base_dir, "frontend")
    py_exec = os.path.join(backend_dir, "venv", "Scripts", "python.exe")

    # Start backend
    be_proc = subprocess.Popen(
        [py_exec, "-m", "uvicorn", "app.main:app", "--port", "8000"],
        cwd=backend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    # Start frontend
    fe_proc = subprocess.Popen(
        ["cmd.exe", "/c", "npx", "vite", "--port", "5173", "--host", "127.0.0.1"],
        cwd=frontend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    time.sleep(3)

    try:
        # 1. Test backend health directly
        with urllib.request.urlopen("http://127.0.0.1:8000/api/health", timeout=5) as res:
            assert res.status == 200
            data = json.loads(res.read().decode())
            print(f"  ✓ Direct Backend API: 200 OK (Status: {data['status']}, Mode: {data['ai_engine_mode']})")

        # 2. Test frontend index.html
        with urllib.request.urlopen("http://127.0.0.1:5173/", timeout=5) as res:
            assert res.status == 200
            html_text = res.read().decode()
            assert "BrandGuard" in html_text or "div id=\"root\"" in html_text
            print(f"  ✓ Frontend Web Server: 200 OK (Served HTML with root mount element)")

        # 3. Test frontend proxy to backend
        with urllib.request.urlopen("http://127.0.0.1:5173/api/health", timeout=5) as res:
            assert res.status == 200
            proxy_data = json.loads(res.read().decode())
            assert proxy_data["status"] == "healthy"
            print(f"  ✓ Frontend-to-Backend Proxy: 200 OK (Proxy /api/health succeeded!)")

        print("\n✨ Both servers started and communicated without errors!")
    finally:
        be_proc.terminate()
        fe_proc.terminate()
        try:
            be_proc.wait(timeout=2)
            fe_proc.wait(timeout=2)
        except Exception:
            be_proc.kill()
            fe_proc.kill()

if __name__ == "__main__":
    test_live_servers()
