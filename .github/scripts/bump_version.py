#!/usr/bin/env python3
"""
محاسبه‌ی نسخه‌ی بعدی به روش سفارشی (غیراستاندارد نسبت به semver رایج):
هر بخش (major/minor/patch) جدا و مستقل جمع زده می‌شود، بدون صفر کردن بخش‌های دیگر.

قوانین شمارش/دسته‌بندی خط‌به‌خط (نه فقط خط اول/subject هر commit):
  - fix: ...                             -> +1 به patch، زیر «Bug Fixes»
  - feat: ...                            -> +1 به minor، زیر «Features»
  - feat!: ... / fix!: ... / BREAKING CHANGE: ... -> +1 به major، زیر «Breaking Changes»

اگر هیچ تگ معتبری وجود نداشته باشد، v1.0.0 به‌عنوان نسخه‌ی پایه ساخته می‌شود.
"""
from __future__ import annotations

import os
import re
import subprocess
import sys

REPO = os.environ.get("GITHUB_REPOSITORY", "")


def run(cmd: str) -> str:
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.stdout.strip()


def get_last_tag() -> str | None:
    tags = run("git tag --list 'v[0-9]*.[0-9]*.[0-9]*'").splitlines()
    tags = [t for t in tags if re.fullmatch(r"v\d+\.\d+\.\d+", t)]
    if not tags:
        return None
    tags.sort(key=lambda t: tuple(int(x) for x in t[1:].split(".")))
    return tags[-1]


def get_commits_since(last_tag: str | None) -> list[tuple[str, str]]:
    """هر آیتم: (هش کوتاه commit, متن کامل subject+body)"""
    rng = f"{last_tag}..HEAD" if last_tag else "HEAD"
    log = run(f'git log {rng} --no-merges --pretty=format:"@@@COMMIT@@@%h%n%s%n%b"')
    if not log:
        return []
    commits = []
    for part in log.split("@@@COMMIT@@@"):
        part = part.strip("\n")
        if not part.strip():
            continue
        lines = part.split("\n", 1)
        commit_hash = lines[0].strip()
        text = lines[1] if len(lines) > 1 else ""
        commits.append((commit_hash, text))
    return commits


def count_bumps(commits: list[tuple[str, str]]) -> tuple[int, int, int]:
    major = minor = patch = 0
    for _, text in commits:
        major += text.count("BREAKING CHANGE:")
        for line in text.splitlines():
            line = line.strip()
            if re.match(r"^\w+(\(.+\))?!:", line):
                major += 1
            elif re.match(r"^feat(\(.+\))?:", line):
                minor += 1
            elif re.match(r"^fix(\(.+\))?:", line):
                patch += 1
    return major, minor, patch


def write_output(key: str, value: str) -> None:
    with open(os.environ["GITHUB_OUTPUT"], "a") as f:
        f.write(f"{key}={value}\n")


def write_multiline_output(key: str, value: str) -> None:
    delimiter = "GHACTIONS_EOF"
    with open(os.environ["GITHUB_OUTPUT"], "a") as f:
        f.write(f"{key}<<{delimiter}\n{value}\n{delimiter}\n")


def build_changelog(commits: list[tuple[str, str]]) -> str:
    """
    برخلاف نسخه‌ی قبلی که فقط خط اول هر commit را می‌دید، این نسخه هر خط را
    جدا بررسی می‌کند — یعنی چند pattern در یک commit (چند -m یا چند پاراگراف)
    هم به‌صورت آیتم‌های جدا زیر دسته‌ی خودشان لیست می‌شوند، دقیقاً مثل خروجی
    خودکار گیت‌هاب ولی بدون محدودیت «فقط خط اول».
    """
    breaking, features, fixes = [], [], []

    for commit_hash, text in commits:
        link = f"[{commit_hash}](https://github.com/{REPO}/commit/{commit_hash})" if REPO else commit_hash

        for line in text.splitlines():
            line = line.strip()
            if not line:
                continue

            m = re.match(r"^BREAKING CHANGE:\s*(.*)", line)
            if m:
                breaking.append(f"- {m.group(1).strip()} ({link})")
                continue

            m = re.match(r"^\w+(\(.+\))?!:\s*(.*)", line)
            if m:
                breaking.append(f"- {m.group(2).strip()} ({link})")
                continue

            m = re.match(r"^feat(\(.+\))?:\s*(.*)", line)
            if m:
                features.append(f"- {m.group(2).strip()} ({link})")
                continue

            m = re.match(r"^fix(\(.+\))?:\s*(.*)", line)
            if m:
                fixes.append(f"- {m.group(2).strip()} ({link})")
                continue

    sections = []
    if breaking:
        sections.append("### 💥 Breaking Changes\n" + "\n".join(breaking))
    if features:
        sections.append("### ✨ Features\n" + "\n".join(features))
    if fixes:
        sections.append("### 🐛 Bug Fixes\n" + "\n".join(fixes))

    return "\n\n".join(sections) if sections else "بدون تغییر قابل ذکر"


def main() -> None:
    last_tag = get_last_tag()

    if last_tag is None:
        print("هیچ تگ معتبری (vX.Y.Z) پیدا نشد؛ نسخه‌ی پایه v1.0.0 ساخته می‌شود.", file=sys.stderr)
        commits = get_commits_since(None)
        write_output("new_tag", "v1.0.0")
        write_output("new_version", "1.0.0")
        write_multiline_output("changelog", build_changelog(commits))
        write_output("skip", "false")
        return

    major, minor, patch = (int(x) for x in last_tag[1:].split("."))
    commits = get_commits_since(last_tag)

    major_count, minor_count, patch_count = count_bumps(commits)

    print(
        f"از تگ {last_tag}: {major_count} major, {minor_count} minor, {patch_count} patch",
        file=sys.stderr,
    )

    if major_count == 0 and minor_count == 0 and patch_count == 0:
        print("هیچ commit با فرمت fix:/feat:/feat! پیدا نشد؛ تگ جدیدی ساخته نمی‌شود.", file=sys.stderr)
        write_output("skip", "true")
        return

    new_major, new_minor, new_patch = major + major_count, minor + minor_count, patch + patch_count
    write_output("new_tag", f"v{new_major}.{new_minor}.{new_patch}")
    write_output("new_version", f"{new_major}.{new_minor}.{new_patch}")
    write_multiline_output("changelog", build_changelog(commits))
    write_output("skip", "false")


if __name__ == "__main__":
    main()