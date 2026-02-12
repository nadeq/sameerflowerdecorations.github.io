from flask import Flask, render_template, send_from_directory, request, jsonify
from email.message import EmailMessage
import os
import smtplib
import ssl


app = Flask(__name__, template_folder=".", static_folder=None)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/css/<path:filename>")
def css(filename):
    return send_from_directory("css", filename)


@app.route("/js/<path:filename>")
def js(filename):
    return send_from_directory("js", filename)


@app.route("/images/<path:filename>")
def images(filename):
    return send_from_directory("images", filename)


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
    to_email = os.getenv("TO_EMAIL")
    from_email = os.getenv("FROM_EMAIL") or smtp_user

    if not all([smtp_host, smtp_user, smtp_pass, to_email, from_email]):
        return jsonify({"ok": False, "error": "Email server is not configured."}), 500

    msg = EmailMessage()
    msg["Subject"] = f"New Event Inquiry - {event_type}"
    msg["From"] = from_email
    msg["To"] = to_email
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


if __name__ == "__main__":
    app.run(debug=True,host='0.0.0.0', port=5002)
