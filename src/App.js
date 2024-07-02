import React, { useState, useRef, useEffect } from 'react';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Offcanvas from 'react-bootstrap/Offcanvas';
import 'bootstrap/dist/css/bootstrap.min.css';
import { IoMdAddCircle, IoMdEye, IoMdSettings, IoMdDownload } from 'react-icons/io';
import logo from './logo.png';

function App() {
  const [height, setHeight] = useState('');
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [iframes, setIframes] = useState([]);
  const [showOffCanvas, setShowOffCanvas] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);
  const [showExitPresentation, setShowExitPresentation] = useState(false);
  const [scrollingDown, setScrollingDown] = useState(true);
  const [scrollInterval, setScrollInterval] = useState(null);

  const containerRef = useRef(null);
  const presentationRef = useRef(null);

  const handleCloseModal = () => setShowModal(false);
  const handleShowModal = () => setShowModal(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url && height) {
      setIframes([...iframes, { url, height, name }]);
      setUrl('');
      setHeight('');
      setName('');
      handleCloseModal();
    }
  };

  const handleDeleteItem = (index) => {
    setIframes(iframes.filter((_, i) => i !== index));
  };

  const handleEnterPresentationMode = () => {
    setPresentationMode(true);
    setShowExitPresentation(true);
    containerRef.current.requestFullscreen(); // Entra em tela cheia
    containerRef.current.style.padding = '0';
    startAutoScroll();
  };

  const handleExitPresentationMode = () => {
    setPresentationMode(false);
    setShowExitPresentation(false);
    document.exitFullscreen(); // Sai da tela cheia
    containerRef.current.style.padding = '20px';
    stopAutoScroll();
  };

  const handleMouseMove = () => {
    if (presentationMode) {
      setShowExitPresentation(true);
    }
  };

  const handleMouseLeave = () => {
    if (presentationMode) {
      setShowExitPresentation(false);
    }
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('index', index.toString());
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    const draggedIndex = parseInt(e.dataTransfer.getData('index'));
    const updatedFrames = [...iframes];
    const [draggedItem] = updatedFrames.splice(draggedIndex, 1);
    updatedFrames.splice(targetIndex, 0, draggedItem);
    setIframes(updatedFrames);
  };

  const handleImportConfig = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      const config = JSON.parse(reader.result);
      setIframes(config.iframes || []);
    };
    reader.readAsText(file);
  };

  const handleDownloadConfig = () => {
    const config = {
      iframes,
    };
    const blob = new Blob([JSON.stringify(config)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const applyStylesToIframeContent = (iframeElement) => {
    iframeElement.addEventListener("load", () => {
      const iframeDocument = iframeElement.contentDocument || iframeElement.contentWindow.document;
      const styleElement = iframeDocument.createElement("style");
      styleElement.textContent = ".logoBar { display: none !important; background-color: #ff0000 !important }"; // Estilo para esconder .logoBar
      iframeDocument.head.appendChild(styleElement);
    });
  };

  const startAutoScroll = () => {
    const interval = setInterval(() => {
      if (presentationRef.current) {
        const maxScrollTop = presentationRef.current.scrollHeight - presentationRef.current.clientHeight;
        const currentScrollTop = presentationRef.current.scrollTop;

        if (scrollingDown) {
          if (currentScrollTop < maxScrollTop) {
            presentationRef.current.scrollBy({ top: 100, behavior: 'smooth' });
          } else {
            setScrollingDown(false);
          }
        } else {
          if (currentScrollTop > 0) {
            presentationRef.current.scrollBy({ top: -100, behavior: 'smooth' });
          } else {
            setScrollingDown(true);
          }
        }
      }
    }, 1000); // Intervalo de 1 segundo para rolagem
    setScrollInterval(interval);
  };

  const stopAutoScroll = () => {
    if (scrollInterval) {
      clearInterval(scrollInterval);
      setScrollInterval(null);
    }
  };

  useEffect(() => {
    return () => stopAutoScroll();
  }, []);

  return (
    <>
      <Navbar style={{ height: '35px', backgroundColor: '#ff6200' }}>
        <Container fluid className="d-flex justify-content-between align-items-center">
          <img src={logo} height={'30px'} alt="Logo" />
          <div className="d-flex align-items-center">
            <IoMdEye style={{ fontSize: '1.5rem', color: 'white', marginLeft: '10px' }} onClick={handleEnterPresentationMode} />
            <IoMdAddCircle style={{ fontSize: '1.5rem', color: 'white', marginLeft: '10px' }} onClick={handleShowModal} />
            <IoMdSettings style={{ fontSize: '1.5rem', color: 'white', marginLeft: '10px' }} onClick={() => setShowOffCanvas(true)} />
            <IoMdDownload style={{ fontSize: '1.5rem', color: 'white', marginLeft: '10px' }} onClick={handleDownloadConfig} />
            <Button
              className="me-2"
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                padding: 0, marginLeft: '10px'
              }}
            >
              <input
                type="file"
                accept=".json"
                onChange={handleImportConfig}
              />
            </Button>
          </div>
        </Container>
      </Navbar>

      {showOffCanvas && (
        <Offcanvas show={showOffCanvas} onHide={() => setShowOffCanvas(false)}>
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>Editar Slides</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {iframes.map((iframe, index) => (
                <li
                  key={index}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  style={{
                    marginBottom: '10px',
                    padding: '10px',
                    border: '1px solid #ccc',
                    backgroundColor: '#f0f0f0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <Form.Label className="mb-1">Nome do Slide:</Form.Label>
                      <Form.Control
                        type="text"
                        value={iframe.name}
                        onChange={(e) => {
                          const updatedIframes = [...iframes];
                          updatedIframes[index].name = e.target.value;
                          setIframes(updatedIframes);
                        }}
                        style={{ maxWidth: '100%' }}
                      />
                      <Form.Label className="mb-1">URL:</Form.Label>
                      <Form.Control
                        type="text"
                        value={iframe.url}
                        onChange={(e) => {
                          const updatedIframes = [...iframes];
                          updatedIframes[index].url = e.target.value;
                          setIframes(updatedIframes);
                        }}
                        style={{ maxWidth: '100%' }}
                      />
                      <Form.Label className="mb-1">Altura:</Form.Label>
                      <Form.Control
                        type="text"
                        value={iframe.height}
                        onChange={(e) => {
                          const updatedIframes = [...iframes];
                          updatedIframes[index].height = e.target.value;
                          setIframes(updatedIframes);
                        }}
                        style={{ maxWidth: '100%'                      }}
                        style={{ maxWidth: '100%' }}
                      />
                    </div>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteItem(index)}>
                      Deletar
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </Offcanvas.Body>
        </Offcanvas>
      )}
  
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Adicionar Dash</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="formHeight">
              <Form.Label>Altura do Página:</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ex: 600px"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="formUrl">
              <Form.Label>URL do Dash:</Form.Label>
              <Form.Control
                type="text"
                placeholder="https://exemplo.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="formName">
              <Form.Label>Nome do Slide:</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nome do Slide"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Form.Group>
            <Button variant="primary" type="submit" style={{
              marginTop: '10px',
            }}>
              Adicionar
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
  
      <div
        ref={containerRef}
        style={{
          padding: '20px',
          background: '#414141',
          minHeight: '100vh',
          color: 'white',
          transition: 'padding 0.3s ease',
          overflow: 'hidden', // Remove o scroll do container
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {iframes.map((iframe, index) => (
          <div key={index} style={{ marginBottom: '10px', textAlign: 'center' }}>
            <iframe
              src={iframe.url}
              width="100%"
              height={iframe.height}
              style={{ border: 'none' }}
              id='iframe1'
              scrolling="no" // Aqui está o atributo para remover o scroll
              onLoad={(e) => applyStylesToIframeContent(e.target)} // Aplicando estilos após o carregamento
            ></iframe>
          </div>
        ))}
  
        {presentationMode && (
          <div
            ref={presentationRef}
            className="frame"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100vh',
              zIndex: 1,
              overflow: 'auto',
              background: '#414141',
            }}
          >
            {iframes.map((iframe, index) => (
              <div key={index} style={{ textAlign: 'center' }}>
                <iframe
                  src={iframe.url}
                  width="100%"
                  height={iframe.height}
                  style={{ border: 'none' }}
                  scrolling="no" // Aqui está o atributo para remover o scroll
                ></iframe>
              </div>
            ))}
            {showExitPresentation && (
              <Button
                variant="light"
                onClick={handleExitPresentationMode}
                style={{ position: 'fixed', top: '20px', right: '20px' }}
              >
                Sair da Apresentação
              </Button>
            )}
            <Button
              variant="light"
              onClick={handleExitPresentationMode}
              style={{ position: 'fixed', bottom: '20px', right: '20px' }}
            >
              Parar Rolagem Automática
            </Button>
          </div>
        )}
      </div>
    </>
  );
  }
  
  export default App;
  
