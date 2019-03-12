import pytesseract
from PIL import Image
import re
import hashlib

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"
img=Image.open('toc3.jpeg')
text=pytesseract.image_to_string('toc3.jpeg')
text=text.lower()


x = re.findall("[a-z][a-z][a-z][1-6][0-9][0-9][0-9]", text)
y = re.findall("[a-g][1-2]", text)
ye=re.findall("[2-3][0-9][0-9][0-9]", text)
if(re.search("continuous assessment test",text)):
    exv="CAT"
else:
    exv="FAT"
cCode=x[0]
slot=y[0]
year=ye[0]
print("The course code of this paper is ",cCode)
print("The slot of this paper is ",slot)
print("The year is ",year)
print("The Exam Version Is", exv)

qp2=cCode+"_"+slot+"_"+year+"_"+exv


qp1=hashlib.md5(qp2.encode())
qp11=qp1.hexdigest()


qpid=qp11+"+"+qp2
print("The question Paper ID is ", qpid)

with open('file.txt', 'w') as f:
    print(qpid, file=f)