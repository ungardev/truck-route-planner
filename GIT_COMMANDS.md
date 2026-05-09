# Git Setup Commands for Truck Route Planner

Follow these exact commands to initialize your Git repository and push to GitHub.

---

## Prerequisites

1. Make sure you have Git installed: `git --version`
2. You need a GitHub account
3. Create a new empty repository on GitHub.com (don't initialize with README)

---

## Step 1: Initialize Git Repository

```bash
# Navigate to project root
cd "C:\Users\ungar\Documents\Dev\InterviewFullStack"

# Initialize git repository
git init

# Configure git (replace with your info)
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

---

## Step 2: Add Files to Staging

```bash
# Add all files (respects .gitignore)
git add .

# Verify what will be committed
git status
```

---

## Step 3: Create Initial Commit

```bash
# Create commit with descriptive message
git commit -m "Initial commit: Full Stack Truck Route Planner with HOS Engine

- Django 5.2 LTS Backend with FMCSA HOS calculation engine
- React + Vite + Tailwind CSS Frontend
- Interactive Leaflet map with OpenStreetMap
- SVG-based ELD daily log generator
- Nominatim geocoding integration
- Implements 49 CFR Part 395 HOS regulations"
```

---

## Step 4: Create GitHub Repository (if not already created)

Go to: https://github.com/new

Fill in:
- **Repository name:** `truck-route-planner`
- **Description:** `Full Stack HOS-Compliant Route Planner & ELD Logs Generator`
- **Private/Public:** Choose based on your preference
- **DO NOT** check "Initialize with README"

Click **Create repository**

---

## Step 5: Connect Local Repo to GitHub

```bash
# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/truck-route-planner.git

# Verify remote is set correctly
git remote -v
```

---

## Step 6: Push to GitHub

```bash
# Push to main branch (first time -u sets upstream)
git branch -M main
git push -u origin main
```

---

## Verify Success

After pushing, you should see:
```
Enumerating objects: xx, done.
Counting objects: 100%
Writing objects: 100%
```

Go to your GitHub repository URL to verify all files are there.

---

## Useful Git Commands (for reference)

```bash
# Check status
git status

# See what files changed
git diff

# See commit history
git log --oneline

# Add specific file
git add README.md

# Unstage file
git reset HEAD filename

# Amend last commit (if you made a mistake)
git commit --amend -m "Updated message"

# Create new branch
git checkout -b feature/my-feature

# Switch branches
git checkout main
```

---

## Important Notes

1. **DO NOT commit `venv/` or `node_modules/`** - they are in `.gitignore`
2. **DO NOT commit `.env` files** with API keys (there are none for this project)
3. The `.gitignore` is pre-configured for both Python and Node.js projects

---

## After GitHub Setup

Once your code is on GitHub, you can:
1. Deploy frontend to **Vercel** (connect directly to GitHub)
2. Deploy backend to **Railway** or **Render** (connect to GitHub)
3. Create a **Loom video** explaining your project
4. Submit all links to Spotter AI