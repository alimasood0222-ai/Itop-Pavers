import cv2, numpy as np
import sys
src=sys.argv[1] if len(sys.argv)>1 else 'itop-pavers-logo-original.png'
im=cv2.imread(src); S=6
big=cv2.resize(im,None,fx=S,fy=S,interpolation=cv2.INTER_CUBIC).astype(np.int16)
b,g,r=big[...,0],big[...,1],big[...,2]
orange=((r>170)&(r-b>90)&(g<170)).astype(np.uint8)*255
dark=((r<110)&(g<110)&(b<110)).astype(np.uint8)*255
k=np.ones((3,3),np.uint8)
def paths(mask,eps):
    mask=cv2.morphologyEx(mask,cv2.MORPH_OPEN,k)
    cs,h=cv2.findContours(mask,cv2.RETR_CCOMP,cv2.CHAIN_APPROX_NONE)
    out=[]
    for c in cs:
        if cv2.contourArea(c)<40*S: continue
        a=cv2.approxPolyDP(c,eps,True).reshape(-1,2)/S
        out.append('M'+' L'.join(f'{x:.2f} {y:.2f}' for x,y in a)+'Z')
    return ' '.join(out)
# bounding box
ys,xs=np.where((orange|dark)>0); x0,x1,y0,y1=xs.min()/S,xs.max()/S,ys.min()/S,ys.max()/S
print('bbox',x0,y0,x1,y1)
po=paths(orange,1.6); pd=paths(dark,1.6)
open('o.txt','w').write(po); open('d.txt','w').write(pd)
vb=f'{x0-1:.1f} {y0-1:.1f} {x1-x0+2:.1f} {y1-y0+2:.1f}'
open('vb.txt','w').write(vb)
for bg,wc,name in [('#131313','#ffffff','dark'),('#ffffff','#131313','light')]:
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{(x1-x0+2)*4:.0f}" style="background:{bg}"><path fill="#EA680F" fill-rule="evenodd" d="{po}"/><path fill="{wc}" fill-rule="evenodd" d="{pd}"/></svg>'
    open(f'logo_{name}.svg','w').write(svg)
print(len(po),len(pd))
