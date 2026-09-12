#!/usr/bin/env python3
"""
محاسبه‌ی نسخه‌ی بعدی به روش سفارشی (غیراستاندارد نسبت به semver رایج):
هر بخش (major/minor/patch) جدا و مستقل جمع زده می‌شود، بدون صفر کردن بخش‌های دیگر.

قوانین شمارش commit ها از آخرین تگ معتبر (vX.Y.Z) تا الان:
  - fix: ...                          -> +1 به patch
  - feat: ...                         -> +1 به minor
  - feat!: ...  یا بدنه‌ی BREAKING CHANGE: -> +1 به major

اگر هیچ تگ معتبری وجود نداشته باشد، v1.0.0 به‌عنوان نسخه‌ی پایه ساخته می‌شود
(بدون شمارش تاریخچه‌ی قبلی) — یعنی این اسکریپت فقط یک بار در ابتدای کار، نقطه‌ی
شروع تمیز v1.0.0 می‌سازد.
"""
from __future__ import annotations

import os
import re
import subprocess
import sys


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


def get_commits_since(last_tag: str | None) -> list[str]:
    rng = f"{last_tag}..HEAD" if last_tag else "HEAD"
    log = run(f'git log {rng} --no-merges --pretty=format:"@@@COMMIT@@@%n%s%n%b"')
    if not log:
        return []
    parts = log.split("@@@COMMIT@@@\n")
    return [p for p in parts if p.strip()]


def count_bumps(commits: list[str]) -> tuple[int, int, int]:
    """
    برخلاف نسخه‌ی قبلی (که فقط خط اول/subject هر commit را می‌دید)،
    این نسخه هر خط را جدا بررسی می‌کند — یعنی چند pattern در یک commit
    (با چند -m یا چند پاراگراف) هم جدا جدا شمارش می‌شوند.
    """
    major = minor = patch = 0
    for commit_text in commits:
        major += commit_text.count("BREAKING CHANGE:")
        for line in commit_text.splitlines():
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


def main() -> None:
    last_tag = get_last_tag()

    if last_tag is None:
        print("هیچ تگ معتبری (vX.Y.Z) پیدا نشد؛ نسخه‌ی پایه v1.0.0 ساخته می‌شود.", file=sys.stderr)
        write_output("new_tag", "v1.0.0")
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

    new_tag = f"v{major + major_count}.{minor + minor_count}.{patch + patch_count}"
    write_output("new_tag", new_tag)
    write_output("skip", "false")


if __name__ == "__main__":
    main()