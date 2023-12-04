import logo from './logo.svg';
import './App.css';
// import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import download from 'downloadjs'

import { Header } from "./Header";
import { useRef, useState, useEffect } from "react";
import { AddSigDialog } from "./components/AddSigDialog";
import Drop from "./Drop";
import { blobToURL } from "./utils/Utils";
import { BigButton } from "./components/BigButton";
import DraggableText from "./components/DraggableText";
import dayjs from "dayjs";
import DraggableSignature from "./components/DraggableSignature";
import { Document, Page, pdfjs } from "react-pdf";
import PagingControl from "./components/PagingControl";
import { PDFDocument, rgb } from "pdf-lib";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
// pdfjs.GlobalWorkerOptions.workerSrc = new URL(
//     'pdfjs-dist/build/pdf.worker.min.js',
//     import.meta.url,
//   ).toString();




// const url = 'https://pdf-lib.js.org/assets/with_update_sections.pdf'
// const existingPdfBytes = await fetch(url).then(res => res.arrayBuffer())

// const pdfDoc = await PDFDocument.load(existingPdfBytes)
// const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

// const pages = pdfDoc.getPages()
// const firstPage = pages[0]
// const { width, height } = firstPage.getSize()
// firstPage.drawText('Oh yes', {
//     x: 5,
//     y: height / 2 + 300,
//     size: 50,
//     font: helveticaFont,
//     color: rgb(0.95, 0.1, 0.1),
//     rotate: degrees(-45),
// })
// const pdfBytes = await pdfDoc.save()

// download(pdfBytes, "pdf-lib_creation_example.pdf", "application/pdf");

function downloadURI(uri, name) {
    var link = document.createElement("a");
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


function App() {
    const styles = {
        container: {
            maxWidth: 900,
            margin: "0 auto",
        },
        sigBlock: {
            display: "inline-block",
            border: "1px solid #000",
        },
        documentBlock: {
            maxWidth: 800,
            margin: "20px auto",
            marginTop: 8,
            border: "1px solid #999",
        },
        controls: {
            maxWidth: 800,
            margin: "0 auto",
            marginTop: 8,
        },
    };

    const [pdf, setPdf] = useState(null);
    const [autoDate, setAutoDate] = useState(true);
    const [signatureURL, setSignatureURL] = useState(null);
    const [position, setPosition] = useState(null);
    const [signatureDialogVisible, setSignatureDialogVisible] = useState(false);
    const [textInputVisible, setTextInputVisible] = useState(false);
    const [pageNum, setPageNum] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [pageDetails, setPageDetails] = useState(null);
    const documentRef = useRef(null);

    useEffect(() => {
        init();
    }, [])

    const init = async () => {
        const url = 'https://pdf-lib.js.org/assets/with_update_sections.pdf'
        const existingPdfBytes = await fetch(url).then(res => res.arrayBuffer())
        // const pdfDoc = await PDFDocument.load(existingPdfBytes)
        
        // const pdfBytes = await pdfDoc.save()
        setPdf(existingPdfBytes)
        


    }

    useEffect(()=>{
        console.log(pdf)
    },[pdf])

    return (
        <div>
            <Header />
            <div style={styles.container}>
                {signatureDialogVisible ? (
                    <AddSigDialog
                        autoDate={autoDate}
                        setAutoDate={setAutoDate}
                        onClose={() => setSignatureDialogVisible(false)}
                        onConfirm={(url) => {
                            setSignatureURL(url);
                            setSignatureDialogVisible(false);
                        }}
                    />
                ) : null}

                {!pdf ? (
                    <Drop
                        onLoaded={async (files) => {
                            const URL = await blobToURL(files[0]);
                            console.log(URL)
                            setPdf(URL);
                        }}
                    />
                ) : null}
                {pdf ? (
                    <div>
                        <div style={styles.controls}>
                            {!signatureURL ? (
                                <BigButton
                                    marginRight={8}
                                    title={"Add signature"}
                                    onClick={() => setSignatureDialogVisible(true)}
                                />
                            ) : null}

                            <BigButton
                                marginRight={8}
                                title={"Add Date"}
                                onClick={() => setTextInputVisible("date")}
                            />

                            {/* <BigButton
                                marginRight={8}
                                title={"Add Text"}
                                onClick={() => setTextInputVisible(true)}
                            /> */}
                            <BigButton
                                marginRight={8}
                                title={"Reset"}
                                onClick={() => {
                                    setTextInputVisible(false);
                                    setSignatureDialogVisible(false);
                                    setSignatureURL(null);
                                    setPdf(null);
                                    setTotalPages(0);
                                    setPageNum(0);
                                    setPageDetails(null);
                                }}
                            />
                            {pdf ? (
                                <BigButton
                                    marginRight={8}
                                    inverted={true}
                                    title={"Download"}
                                    onClick={() => {
                                        downloadURI(pdf, "file.pdf");
                                    }}
                                />
                            ) : null}
                        </div>
                        <div ref={documentRef} className="docme" style={styles.documentBlock}>
                            {textInputVisible ? (
                                <DraggableText
                                    initialText={
                                        textInputVisible === "date"
                                            ? dayjs().format("M/d/YYYY")
                                            : null
                                    }
                                    onCancel={() => setTextInputVisible(false)}
                                    onEnd={setPosition}
                                    onSet={async (text) => {
                                        const { originalHeight, originalWidth } = pageDetails;
                                        const scale = originalWidth / documentRef.current.clientWidth;
                                        console.log('originalWidth', originalWidth)
                                        console.log('Ref.current.clientWidth',documentRef.current.clientWidth)
                                        console.log('scale',scale)

                                        const y =
                                            documentRef.current.clientHeight -
                                            (position.y +
                                                (12 * scale) -
                                                position.offsetY -
                                                documentRef.current.offsetTop);
                                        const x =
                                            position.x -
                                            166 -
                                            position.offsetX -
                                            documentRef.current.offsetLeft;

                                        // new XY in relation to actual document size
                                        const newY =
                                            (y * originalHeight) / documentRef.current.clientHeight;
                                        const newX =
                                            (x * originalWidth) / documentRef.current.clientWidth;
                                        console.log('ArrayBuffer',pdf)
                                        const pdfDoc = await PDFDocument.load(pdf);

                                        const pages = pdfDoc.getPages();
                                        const firstPage = pages[pageNum];

                                        firstPage.drawText(text, {
                                            x: newX,
                                            y: newY,
                                            size: 20 * scale,
                                        });

                                        const pdfBytes = await pdfDoc.save();
                                        const blob = new Blob([new Uint8Array(pdfBytes)]);

                                        const URL = await blobToURL(blob);
                                        setPdf(URL);
                                        setPosition(null);
                                        setTextInputVisible(false);
                                    }}
                                />
                            ) : null}
                            {signatureURL ? (
                                <DraggableSignature
                                    url={signatureURL}
                                    onCancel={() => {
                                        setSignatureURL(null);
                                    }}
                                    onSet={async () => {
                                        const { originalHeight, originalWidth } = pageDetails;
                                        const scale = originalWidth / documentRef.current.clientWidth;

                                        console.log('originalWidth', originalWidth)
                                        console.log('Ref.current.clientWidth',documentRef.current.clientWidth)
                                        console.log('scale',scale)
                                        
                                        const y =
                                            documentRef.current.clientHeight -
                                            (position.y -
                                                position.offsetY +
                                                64 -
                                                documentRef.current.offsetTop);
                                        const x =
                                            position.x -
                                            160 -
                                            position.offsetX -
                                            documentRef.current.offsetLeft;

                                        // new XY in relation to actual document size
                                        const newY = (y * originalHeight) / documentRef.current.clientHeight;
                                        const newX = (x * originalWidth) / documentRef.current.clientWidth;

                                        // const pdfDoc = await PDFDocument.load(pdf);
                                        const url = 'https://pdf-lib.js.org/assets/with_update_sections.pdf'
                                        const existingPdfBytes = await fetch(url).then(res => res.arrayBuffer())
                                        const pdfDoc = await PDFDocument.load(existingPdfBytes)

                                        
                                        const pages = pdfDoc.getPages();
                                        const firstPage = pages[pageNum];

                                        const pngImage = await pdfDoc.embedPng(signatureURL);
                                        const pngDims = pngImage.scale(scale * .3);

                                        firstPage.drawImage(pngImage, {
                                            x: newX,
                                            y: newY,
                                            width: pngDims.width,
                                            height: pngDims.height,
                                        });

                                        if (autoDate) {
                                            firstPage.drawText(
                                                `Signed ${dayjs().format(
                                                    "M/d/YYYY HH:mm:ss ZZ"
                                                )}`,
                                                {
                                                    x: newX,
                                                    y: newY - 10,
                                                    size: 14 * scale,
                                                    color: rgb(0.074, 0.545, 0.262),
                                                }
                                            );
                                        }

                                        const pdfBytes = await pdfDoc.save();
                                        const blob = new Blob([new Uint8Array(pdfBytes)]);

                                        const URL = await blobToURL(blob);
                                        setPdf(URL);
                                        setPosition(null);
                                        setSignatureURL(null);
                                    }}
                                    onEnd={(data) => {
                                        setPosition(data);
                                        console.log('data',data)
                                    }}
                                />
                            ) : null}
                            <Document
                                file={pdf}
                                onLoadSuccess={(data) => {
                                    setTotalPages(data.numPages);
                                }}
                            >
                                <Page
                                    pageNumber={pageNum + 1}
                                    width={800}
                                    height={1200}
                                    onLoadSuccess={(data) => {
                                        setPageDetails(data);
                                    }}
                                />
                            </Document>
                        </div>
                        <PagingControl
                            pageNum={pageNum}
                            setPageNum={setPageNum}
                            totalPages={totalPages}
                        />
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export default App;
