from flask import Flask, render_template, send_from_directory, request, jsonify, abort
from email.message import EmailMessage
import os
import smtplib
import ssl
from pathlib import Path
from urllib.parse import quote


app = Flask(__name__, template_folder=".", static_folder=None)

GALLERY_FOLDER_MAP = {
    "balloon": "balloon",
    "bridal-garland": "bridal Garland",
    "bridal-jada": "Bridal Jada",
    "bridal-groom-making-ceremonies": "Bridal_Groom_Making_Ceremonies",
    "door-decoration": "door_decoration",
    "haldi": "haldi",
    "mandaps": "mandaps",
    "reception-stages": "reception_stages",
}

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MEDIA_DIRECTORIES = set(GALLERY_FOLDER_MAP.values())
MEDIA_FILES = {"sfd_logo.jpg", "video.mp4"}
DEFAULT_INQUIRY_RECIPIENTS = [
    "abdulkhaleeqkhale29@gmail.com",
]


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/css/<path:filename>")
def css(filename):
    return send_from_directory("css", filename)


@app.route("/js/<path:filename>")
def js(filename):
    return send_from_directory("js", filename)


@app.route("/api/gallery-images")
def gallery_images():
    image_root = Path(app.root_path)
    items = []

    for category, folder_name in GALLERY_FOLDER_MAP.items():
        folder_path = image_root / folder_name
        if not folder_path.exists():
            continue

        image_paths = sorted(
            [path for path in folder_path.rglob("*") if path.suffix.lower() in ALLOWED_IMAGE_EXTENSIONS],
            key=lambda path: path.name.lower(),
        )

        for path in image_paths:
            relative_path = path.relative_to(image_root).as_posix()
            items.append(
                {
                    "src": f"/{quote(relative_path, safe='/')}",
                    "category": category,
                    "alt": path.stem.replace("_", " ").strip(),
                }
            )

    return jsonify({"items": items}), 200


@app.route("/send-inquiry", methods=["POST"])
def send_inquiry():
    data = request.get_json(silent=True) or request.form

    name = (data.get("name") or "").strip()
    phone = (data.get("phone") or "").strip()
    email = (data.get("email") or "").strip()
    event_type = (data.get("eventType") or "").strip()
    event_date = (data.get("eventDate") or "").strip()
    message = (data.get("message") or "").strip()

    if not all([name, phone, email, event_type, event_date]):
        return jsonify({"ok": False, "error": "Missing required fields."}), 400

    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    to_email_raw = os.getenv("TO_EMAIL", "")
    to_emails = [
        item.strip()
        for item in to_email_raw.replace(";", ",").split(",")
        if item.strip()
    ]
    if not to_emails:
        to_emails = DEFAULT_INQUIRY_RECIPIENTS.copy()
    from_email = os.getenv("FROM_EMAIL") or smtp_user

    if not all([smtp_host, smtp_user, smtp_pass, from_email]):
        return jsonify({"ok": False, "error": "Email server is not configured."}), 500

    msg = EmailMessage()
    msg["Subject"] = f"New Event Inquiry - {event_type}"
    msg["From"] = from_email
    msg["To"] = ", ".join(to_emails)
    msg["Reply-To"] = email
    msg.set_content(
        "\n".join(
            [
                "New inquiry received:",
                f"Name: {name}",
                f"Phone: {phone}",
                f"Email: {email}",
                f"Event Type: {event_type}",
                f"Event Date: {event_date}",
                f"Message: {message or 'N/A'}",
            ]
        )
    )

    try:
        if smtp_port == 465:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context) as server:
                server.login(smtp_user, smtp_pass)
                server.send_message(msg)
        else:
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.ehlo()
                server.starttls(context=ssl.create_default_context())
                server.ehlo()
                server.login(smtp_user, smtp_pass)
                server.send_message(msg)
    except Exception:
        return jsonify({"ok": False, "error": "Failed to send email."}), 500

    return jsonify({"ok": True}), 200


@app.route("/<path:asset_path>")
def media_assets(asset_path):
    safe_path = Path(asset_path)
    if safe_path.is_absolute() or ".." in safe_path.parts:
        abort(404)

    if len(safe_path.parts) == 1 and safe_path.parts[0] in MEDIA_FILES:
        return send_from_directory(".", safe_path.parts[0])

    if len(safe_path.parts) >= 2 and safe_path.parts[0] in MEDIA_DIRECTORIES:
        directory = safe_path.parts[0]
        filename = Path(*safe_path.parts[1:]).as_posix()
        return send_from_directory(directory, filename)

    abort(404)


if __name__ == "__main__":
    app.run(debug=True,host='0.0.0.0', port=5002)
