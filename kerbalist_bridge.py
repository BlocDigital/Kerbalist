#!/usr/bin/env python3
"""
Kerbalist Bridge - Companion script connecting kRPC to Kerbalist.

This script connects to a running Kerbal Space Program (KSP 1 or KSP 2) instance
via kRPC / kRPC2 and serves the current Universal Time (UT) over HTTP as JSON:
    GET http://localhost:5005/ut -> {"ut": 1234567.89}

Requirements:
    pip install krpc

Usage:
    python kerbalist_bridge.py
    python kerbalist_bridge.py --port 5005 --rpc-port 50000
"""

import argparse
import json
import sys
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
import krpc

KRPC_CONN = None
VERBOSE = False


class UTBridgeHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        if VERBOSE:
            super().log_message(format, *args)

    def do_GET(self):
        global KRPC_CONN
        if self.path == '/ut' or self.path == '/':
            ut_val = None
            if KRPC_CONN is not None:
                try:
                    ut_val = KRPC_CONN.space_center.ut
                except Exception as e:
                    print(f"[!] Warning: Error reading UT from kRPC: {e}", file=sys.stderr)
                    KRPC_CONN = None

            if ut_val is None:
                # Attempt auto-reconnect if connection failed/dropped
                try:
                    KRPC_CONN = krpc.connect(name="Kerbalist Bridge QuickConnect")
                    ut_val = KRPC_CONN.space_center.ut
                except Exception:
                    pass

            if ut_val is not None:
                payload = json.dumps({"ut": ut_val}).encode('utf-8')
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
                self.end_headers()
                self.wfile.write(payload)
                return

            # Connection failed / kRPC unavailable
            self.send_response(503)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Unable to connect to kRPC instance"}).encode('utf-8'))
            return

        self.send_response(404)
        self.end_headers()

    def do_OPTIONS(self):
        # CORS preflight support
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()


def connect_krpc(address, rpc_port, stream_port):
    print(f"[*] Connecting to kRPC server at {address}:{rpc_port}...")
    try:
        conn = krpc.connect(
            name="Kerbalist Bridge",
            address=address,
            rpc_port=rpc_port,
            stream_port=stream_port
        )
        print(f"[+] Connected to kRPC! Current UT: {conn.space_center.ut:.2f} s")
        return conn
    except Exception as e:
        print(f"[!] Could not connect to kRPC on startup: {e}")
        print("[!] The bridge HTTP server will still start and retry connecting when polled.")
        return None


def main():
    global KRPC_CONN, VERBOSE
    parser = argparse.ArgumentParser(description="Kerbalist kRPC Companion Bridge Server")
    parser.add_argument("--port", type=int, default=5005, help="HTTP server port for Kerbalist (default: 5005)")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="HTTP server host (default: 127.0.0.1)")
    parser.add_argument("--rpc-address", type=str, default="127.0.0.1", help="kRPC server IP (default: 127.0.0.1)")
    parser.add_argument("--rpc-port", type=int, default=50000, help="kRPC RPC port (default: 50000)")
    parser.add_argument("--stream-port", type=int, default=50001, help="kRPC Stream port (default: 50001)")
    parser.add_argument("-v", "--verbose", action="store_true", help="Enable verbose HTTP log output")

    args = parser.parse_args()
    VERBOSE = args.verbose

    KRPC_CONN = connect_krpc(args.rpc_address, args.rpc_port, args.stream_port)

    server_address = (args.host, args.port)
    httpd = HTTPServer(server_address, UTBridgeHandler)

    print(f"[+] Kerbalist Bridge HTTP server running at http://{args.host}:{args.port}/ut")
    print("[*] Press Ctrl+C to stop.")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[*] Shutting down Kerbalist Bridge.")
        if KRPC_CONN:
            try:
                KRPC_CONN.close()
            except Exception:
                pass
        httpd.server_close()


if __name__ == "__main__":
    main()
