from flask import Flask, render_template, send_from_directory


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


if __name__ == "__main__":
    app.run(debug=True,host='127.0.0.1', port=5002)
