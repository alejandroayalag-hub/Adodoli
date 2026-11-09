' Arranca el expediente en segundo plano (sin ventana). Bitácora en app.log
Set fso = CreateObject("Scripting.FileSystemObject")
app = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))
CreateObject("WScript.Shell").Run "cmd /c cd /d """ & app & "\backend"" && node src\index.js >> """ & app & "\app.log"" 2>&1", 0, False
