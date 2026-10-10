#!/usr/bin/env python3
"""
Kerbalist Changes Summary Skill
Detects local changes to src/parts/ and generates a concise summary for Claude.
Usage: python kerbalist-changes-summary.py [--copy] [--repo-path /path/to/kerbalist]
"""

import os
import subprocess
import sys
import json
from pathlib import Path
from datetime import datetime

def get_git_changes(repo_path):
    """Get changed files using git diff."""
    try:
        result = subprocess.run(
            ["git", "diff", "--name-only", "HEAD"],
            cwd=repo_path,
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            return [f for f in result.stdout.strip().split('\n') if f]
        return []
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return []

def get_untracked_files(repo_path):
    """Get untracked files in src/parts/."""
    try:
        result = subprocess.run(
            ["git", "ls-files", "--others", "--exclude-standard", "src/parts/"],
            cwd=repo_path,
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            return [f for f in result.stdout.strip().split('\n') if f]
        return []
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return []

def get_file_diff(repo_path, filepath):
    """Get diff for a single file, limited to first 500 chars."""
    try:
        result = subprocess.run(
            ["git", "diff", "HEAD", "--", filepath],
            cwd=repo_path,
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            diff = result.stdout.strip()
            if len(diff) > 500:
                # Show first 500 chars + summary
                return diff[:500] + f"\n... ({len(diff) - 500} more chars)"
            return diff
        return None
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return None

def get_file_size_change(repo_path, filepath):
    """Get file size change summary."""
    try:
        result = subprocess.run(
            ["git", "show", f"HEAD:{filepath}"],
            cwd=repo_path,
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            old_size = len(result.stdout)
            new_size = os.path.getsize(os.path.join(repo_path, filepath))
            delta = new_size - old_size
            delta_str = f"+{delta}" if delta >= 0 else str(delta)
            return f"{old_size}→{new_size} bytes ({delta_str})"
        return f"{os.path.getsize(os.path.join(repo_path, filepath))} bytes (new file)"
    except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
        try:
            return f"{os.path.getsize(os.path.join(repo_path, filepath))} bytes"
        except OSError:
            return "unknown size"

def generate_summary(repo_path):
    """Generate a concise summary of changes."""
    if not os.path.isdir(repo_path):
        return f"Error: Repository path not found: {repo_path}"

    changed_files = get_git_changes(repo_path)
    untracked_files = get_untracked_files(repo_path)
    
    # Filter to src/parts/ only
    changed_parts = [f for f in changed_files if f.startswith('src/parts/')]
    untracked_parts = [f for f in untracked_files if f.startswith('src/parts/')]

    if not changed_parts and not untracked_parts:
        return "✓ No changes detected in src/parts/"

    summary = []
    summary.append("=" * 70)
    summary.append(f"KERBALIST LOCAL CHANGES - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    summary.append("=" * 70)
    summary.append("")

    # Changed files
    if changed_parts:
        summary.append(f"📝 MODIFIED ({len(changed_parts)} file{'s' if len(changed_parts) != 1 else ''}):")
        summary.append("")
        for filepath in sorted(changed_parts):
            filename = os.path.basename(filepath)
            size_info = get_file_size_change(repo_path, filepath)
            summary.append(f"  • {filename}")
            summary.append(f"    {size_info}")
            
            # Show diff for small changes
            diff = get_file_diff(repo_path, filepath)
            if diff and len(diff) < 300:
                summary.append("    Diff:")
                for line in diff.split('\n')[:10]:
                    if line:
                        summary.append(f"      {line[:60]}")
            summary.append("")

    # Untracked files
    if untracked_parts:
        summary.append(f"✨ NEW ({len(untracked_parts)} file{'s' if len(untracked_parts) != 1 else ''}):")
        summary.append("")
        for filepath in sorted(untracked_parts):
            filename = os.path.basename(filepath)
            try:
                size = os.path.getsize(os.path.join(repo_path, filepath))
                summary.append(f"  • {filename} ({size} bytes)")
            except OSError:
                summary.append(f"  • {filename}")
        summary.append("")

    summary.append("=" * 70)
    summary.append("Copy this block and paste into Claude with: 'Here are my local changes:'")
    summary.append("=" * 70)

    return "\n".join(summary)

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Detect and summarize Kerbalist changes")
    parser.add_argument("--repo-path", default=".", help="Path to Kerbalist repo (default: current dir)")
    parser.add_argument("--copy", action="store_true", help="Copy summary to clipboard")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    
    args = parser.parse_args()
    repo_path = os.path.abspath(args.repo_path)

    summary = generate_summary(repo_path)
    
    if args.json:
        output = {
            "timestamp": datetime.now().isoformat(),
            "repo_path": repo_path,
            "summary": summary
        }
        print(json.dumps(output, indent=2))
    else:
        print(summary)

    if args.copy:
        try:
            import pyperclip
            pyperclip.copy(summary)
            print("\n✓ Copied to clipboard!")
        except ImportError:
            print("\nNote: pyperclip not installed. Install with: pip install pyperclip")
            print("Or use: cat << 'EOF' | xclip -selection clipboard")
            print(summary)
            print("EOF")

if __name__ == "__main__":
    main()
