# ANYCOLOR 專案基本架構

## 1) 第一次啟動（安裝套件）

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

> Windows PowerShell 請改用：
>
> ```powershell
> .venv\Scripts\Activate.ps1
> ```

## 2) 啟動網站

```bash
python app.py
```

## 一鍵啟動（Linux/macOS）

```bash
./run.sh
```


看到類似下面訊息就代表成功：

```text
 * Running on http://127.0.0.1:5000
```

然後在瀏覽器打開：

- <http://127.0.0.1:5000/>

## 3) 放到網上（Render）

這個專案已經包含 Render 需要的 `Procfile` 和 `render.yaml`。

1. 把專案 push 到 GitHub。
2. 到 <https://render.com/> 新增 `Blueprint` 或 `Web Service`。
3. 選這個 GitHub repo。
4. Build Command 使用 `pip install -r requirements.txt`。
5. Start Command 使用 `gunicorn app:app`。

部署完成後，Render 會提供一個公開網址。

## 4) 常見問題

- 如果出現 `ModuleNotFoundError: No module named 'flask'`
  - 代表你還沒安裝套件，請先執行 `pip install -r requirements.txt`
- 如果埠號 5000 被占用
  - 可改成 `flask run --port 5050`，再打開 <http://127.0.0.1:5050/>

## 專案結構

```text
.
├─ app.py
├─ events.json
├─ requirements.txt
├─ templates/
│  └─ index.html
└─ static/
   ├─ script.js
   └─ style.css
```
