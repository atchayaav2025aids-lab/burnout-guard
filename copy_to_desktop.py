import os
import shutil

src = r"C:\Users\HP\.gemini\antigravity\scratch\burnout-guard"

# Determine Desktop path
user_profile = os.environ.get("USERPROFILE", r"C:\Users\HP")
paths_to_check = [
    os.path.join(user_profile, "Desktop"),
    os.path.join(user_profile, "OneDrive", "Desktop")
]

dest_desktop = None
for p in paths_to_check:
    if os.path.exists(p):
        dest_desktop = p
        break

if not dest_desktop:
    dest_desktop = user_profile

dest = os.path.join(dest_desktop, "burnout-guard")
print("Target Desktop Path:", dest)

# Remove existing copy if present
if os.path.exists(dest):
    print("Removing existing directory at destination...")
    try:
        shutil.rmtree(dest)
    except Exception as e:
        print(f"Warning: Could not remove existing target folder: {e}")

# Copy function to ignore node_modules, pycaches, database files, and local uploads
def ignore_patterns(path, names):
    ignored = []
    for name in names:
        if name in ["node_modules", "__pycache__", ".git", "uploads"]:
            ignored.append(name)
        elif name.endswith(".db") or name.endswith(".sqlite"):
            ignored.append(name)
    return ignored

print("Copying project files...")
try:
    shutil.copytree(src, dest, ignore=ignore_patterns, dirs_exist_ok=True)
    print("Project successfully copied to Desktop at:", dest)
except Exception as e:
    print(f"Error copying project: {e}")
