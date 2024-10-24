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
import logo2 from './logo2.png'; // Certifique-se de que o caminho esteja correto


function App() {

  const [showExitPresentation, setShowExitPresentation] = useState(false);

  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [height, setHeight] = useState('');
  const [scrollInterval, setScrollInterval] = useState(1); // em segundos
  const [scrollAmount, setScrollAmount] = useState(100); 
  const [refreshInterval, setRefreshInterval] = useState(30); // em segundos
  const [iframes, setIframes] = useState([]);
  const [showOffCanvas, setShowOffCanvas] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);
  const [scrollingDown, setScrollingDown] = useState(true);

  const containerRef = useRef(null);
  const presentationRef = useRef(null);
  const scrollTimers = useRef([]);
  const refreshTimers = useRef([]);

  const handleCloseModal = () => setShowModal(false);
  const handleShowModal = () => setShowModal(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url && height) {
      setIframes([...iframes, {
        url,
        name,
        height,
        scrollInterval: scrollInterval * 1000, // Convertendo para ms
        scrollAmount: scrollAmount,
        refreshInterval: refreshInterval * 1000, // Convertendo para ms
      }]);
      setUrl('');
      setName('');
      setHeight('');
      setScrollInterval(1); // resetando para 1 segundo
      setScrollAmount(100);
      setRefreshInterval(30); // resetando para 30 segundos
      handleCloseModal();
    }
  };

  const handleDeleteItem = (index) => {
    setIframes(iframes.filter((_, i) => i !== index));
  };

  const startAutoScroll = (index) => {
    stopAutoScroll(index); // Para qualquer rolagem anterior

    const interval = setInterval(() => {
      if (presentationRef.current) {
        const maxScrollTop = presentationRef.current.scrollHeight - presentationRef.current.clientHeight;
        const currentScrollTop = presentationRef.current.scrollTop;

        if (scrollingDown) {
          if (currentScrollTop < maxScrollTop) {
            presentationRef.current.scrollBy({ top: iframes[index].scrollAmount, behavior: 'smooth' });
          } else {
            setScrollingDown(false);
          }
        } else {
          if (currentScrollTop > 0) {
            presentationRef.current.scrollBy({ top: -iframes[index].scrollAmount, behavior: 'smooth' });
          } else {
            setScrollingDown(true);
          }
        }
      }
    }, iframes[index].scrollInterval);
    scrollTimers.current[index] = interval;
  };

  const stopAutoScroll = (index) => {
    if (scrollTimers.current[index]) {
      clearInterval(scrollTimers.current[index]);
      scrollTimers.current[index] = null;
    }
  };

  const startAutoRefresh = (index) => {
    stopAutoRefresh(index); // Para qualquer atualização anterior
  
    const interval = setInterval(() => {
      const updatedIframes = [...iframes];
      // Força a atualização adicionando um timestamp à URL
      const currentUrl = new URL(iframes[index].url);
      currentUrl.searchParams.set('t', Date.now()); // Adiciona um timestamp como parâmetro
      updatedIframes[index].url = currentUrl.toString(); // Atualiza a URL com o timestamp
      setIframes(updatedIframes); // Atualiza o estado
    }, iframes[index].refreshInterval);
    refreshTimers.current[index] = interval;
  };
  


  const stopAutoRefresh = (index) => {
    if (refreshTimers.current[index]) {
      clearInterval(refreshTimers.current[index]);
      refreshTimers.current[index] = null;
    }
  };

  const handleEnterPresentationMode = () => {
    setPresentationMode(true);
    containerRef.current.requestFullscreen(); // Entra em tela cheia
    iframes.forEach((_, index) => {
      startAutoScroll(index);
      startAutoRefresh(index);
    });
  };

  const handleExitPresentationMode = () => {
    setPresentationMode(false);
    document.exitFullscreen(); // Sai da tela cheia
    iframes.forEach((_, index) => {
      stopAutoScroll(index);
      stopAutoRefresh(index);
    });
  };

  useEffect(() => {
    return () => {
      iframes.forEach((_, index) => {
        stopAutoScroll(index);
        stopAutoRefresh(index);
      });
    };
  }, [iframes]);

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
  const applyStylesToIframeContent = (iframeElement) => {
    // Removido o código que acessa o documento do iframe, pois isso causará um erro se o iframe for cross-origin.
    iframeElement.addEventListener("load", () => {
      // Verifique se o iframe está na mesma origem antes de tentar aplicar estilos.
      try {
        const iframeDocument = iframeElement.contentDocument || iframeElement.contentWindow.document;
        const styleElement = iframeDocument.createElement("style");
        styleElement.textContent = ".logoBar { display: none !important; background-color: #ff0000 !important }";
        iframeDocument.head.appendChild(styleElement);
      } catch (error) {
        console.error("Não foi possível acessar o conteúdo do iframe:", error);
      }
    });
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
                      /> <Form.Group controlId={`formScrollInterval-${index}`}>
                      <Form.Label>Intervalo de Rolagem (segundos):</Form.Label>
                      <Form.Control
                        type="number"
                        value={iframe.scrollInterval / 1000}
                        onChange={(e) => {
                          const updatedIframes = [...iframes];
                          updatedIframes[index].scrollInterval = parseInt(e.target.value) * 1000; // Convertendo para ms
                          setIframes(updatedIframes);
                        }}
                      />
                    </Form.Group>
                    <Form.Group controlId={`formScrollAmount-${index}`}>
                      <Form.Label>Quantidade de Rolagem (pixels):</Form.Label>
                      <Form.Control
                        type="number"
                        value={iframe.scrollAmount}
                        onChange={(e) => {
                          const updatedIframes = [...iframes];
                          updatedIframes[index].scrollAmount = parseInt(e.target.value);
                          setIframes(updatedIframes);
                        }}
                      />
                    </Form.Group>
                    <Form.Group controlId={`formRefreshInterval-${index}`}>
                      <Form.Label>Intervalo de Atualização (segundos):</Form.Label>
                      <Form.Control
                        type="number"
                        value={iframe.refreshInterval / 1000}
                        onChange={(e) => {
                          const updatedIframes = [...iframes];
                          updatedIframes[index].refreshInterval = parseInt(e.target.value) * 1000; // Convertendo para ms
                          setIframes(updatedIframes);
                        }}
                      />
                    </Form.Group>
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
            <Form.Group controlId="formScrollInterval">
              <Form.Label>Intervalo de Rolagem (segundos):</Form.Label>
              <Form.Control
                type="number"
                value={scrollInterval}
                onChange={(e) => setScrollInterval(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="formScrollAmount">
              <Form.Label>Quantidade de Rolagem (pixels):</Form.Label>
              <Form.Control
                type="number"
                value={scrollAmount}
                onChange={(e) => setScrollAmount(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="formRefreshInterval">
              <Form.Label>Intervalo de Atualização (segundos):</Form.Label>
              <Form.Control
                type="number"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(e.target.value)}
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
          scrolling="no"
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
    
    {/* Adicionando o logo2 no rodapé direito */}
    <img
      src={logo2}
      alt="Logo 2"
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        width: '200px', // Ajuste o tamanho conforme necessário
        zIndex: 2, // Para garantir que o logo fique acima de outros elementos
      }}
    />
  </div>
)}

      </div>
    </>
  );
  }
  
  export default App;
  
