import React, { useState, useEffect } from 'react';
import '../ElectrophoresisCell.css';

const bandColors = {
  [["pdb", "6X1Q"]]: "#08c8ae",
  [["pdb", "2PRI"]]: "#cacf50",
  [["pdb", "4F5S"]]: "#41add5",
  [["", "AAA68882.1"]]: "#a6106a",
  [["", "NP_001344263.1"]]: "#87cba7",
  [["", "AFP63821.1"]]: "#180ea4",
  [["sp", "Q6L6Q5.1"]]: "#2e8c7b",
  [["", "CAA01755.1"]]: "#be2908",
  [["", ""]]: "#0000FF",
}
const initialProteinStandards = [
  { name: "B-Galactosidase", molecularWeight: 116250, migrationDistance: 0, color: bandColors[["pdb", "6X1Q"]], id_num: '6X1Q', id_str: 'pdb' },
  { name: "Phosphorylase B", molecularWeight: 97400, migrationDistance: 0, color: bandColors[["pdb", "2PRI"]],  id_num: '2PRI', id_str: 'pdb' },
  { name: "Serum Albumin", molecularWeight: 66200, migrationDistance: 0, color: bandColors[["pdb", "4F5S"]],  id_num: '4F5S', id_str: 'pdb' },
  { name: "Ovalbumin", molecularWeight: 45000, migrationDistance: 0, color: bandColors[["", "AAA68882.1"]],  id_num: 'AAA68882.1', id_str: '' },
  { name: "Carbonic Anhydrase", molecularWeight: 31000, migrationDistance: 0, color: bandColors[["", "NP_001344263.1"]],  id_num: 'NP_001344263.1', id_str: '' },
  { name: "Trypsin Inhibitor", molecularWeight: 21500, migrationDistance: 0, color: bandColors[["", "AFP63821.1"]],  id_num: 'AFP63821.1', id_str: '' },
  { name: "Lysozyme", molecularWeight: 14400, migrationDistance: 0, color: bandColors[["sp", "Q6L6Q5.1"]],  id_num: 'Q6L6Q5.1', id_str: 'sp' },
  { name: "Aprotinin", molecularWeight: 6500, migrationDistance: 0, color: bandColors[["", "CAA01755.1"]], id_num: 'CAA01755.1', id_str: '' },
  { name: "BlueDye", molecularWeight: 500, migrationDistance: 0, color: bandColors[["", ""]], id_num: '', id_str: ''  }
];


const GoogleScatterChart = ({ proteinStandards }) => {
  useEffect(() => {
    window.google.charts.load('current', { packages: ['corechart'] });
    window.google.charts.setOnLoadCallback(drawChart);
  }, [proteinStandards]);

  const linearRegression = (data) => {
    let n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
    data.forEach(point => {
      let x = point[0], y = point[1];
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
      sumYY += y * y;
    });

    let slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    let intercept = (sumY - slope * sumX) / n;
    let rSquared = Math.pow((n * sumXY - sumX * sumY) / Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY)), 2);
    return { slope, intercept, rSquared };
  };

  const drawChart = () => {
    const data = new window.google.visualization.DataTable();
    data.addColumn('number', 'Relative Migration');
    data.addColumn('number', 'Log Molecular Weight');
    data.addColumn({ type: 'string', role: 'style' });
    data.addColumn({ type: 'string', role: 'tooltip', p: { html: true } });
    proteinStandards.forEach(protein => {
      const tooltipContent = `<div style="padding:10px; line-height: 1.5; min-width: 150px; font-family: Arial, sans-serif; font-size: 16px;">
                            <strong>${protein.name}</strong><br>
                            Relative Migration: ${protein.migrationDistance.toFixed(2)}<br>
                            Log Molecular Weight: ${Math.log10(protein.molecularWeight).toFixed(2)}
                          </div>`;
      data.addRow([
        protein.migrationDistance,
        Math.log10(protein.molecularWeight),
        `point { fill-color: ${protein.color}; }`, 
        tooltipContent
      ]);
    });

    const chartData = proteinStandards.map(protein => [
      protein.migrationDistance, 
      Math.log10(protein.molecularWeight)
    ]);

    const { slope, intercept, rSquared } = linearRegression(chartData);
    const options = {
      title: 'Log MW vs. Relative Migration',
      hAxis: { title: 'Relative Migration', minValue: 0 },
      vAxis: { title: 'Log Molecular Weight', minValue: 0 },
      legend: 'none',
      tooltip: { isHtml: true },
      pointSize: 5,
      trendlines: { 0: { 
          type: 'linear', 
          visibleInLegend: true, 
          lineWidth: 3, 
          opacity: 0.3,
          showR2: true,
          color: 'black' 
        } 
      }
    };
    const chart = new window.google.visualization.ScatterChart(document.getElementById('scatter_chart_div'));
    chart.draw(data, options);

    document.getElementById('regression-info').innerHTML = `Slope: ${slope.toFixed(4)}, Intercept: ${intercept.toFixed(4)}, R²: ${rSquared.toFixed(4)}`;
  };

  return (
    <>
      <div id="scatter_chart_div" style={{ width: '100%', height: '400px' }}></div>
      <div id="regression-info" style={{ marginTop: '10px' }}></div>
    </>
  );
};



const OneDE = () => {
  const [wellsCount, setWellsCount] = useState(10);
  const [acrylamidePercentage, setAcrylamidePercentage] = useState('7.5%');
  const [voltageValue, setvoltageValue] = useState('50V');
  const [selectedProtein, setSelectedProtein] = useState(null);
  const [animationInProgress, setAnimationInProgress] = useState(false);
  const [isAtStartingPoint, setIsAtStartingPoint] = useState(true);
  const [blueDyeReachedBottom, setBlueDyeReachedBottom] = useState(false);
  const [proteinStandards, setProteinStandards] = useState(initialProteinStandards);
  const [wellResponses, setWellResponses] = useState({0: initialProteinStandards});
  const [files, setFiles] = useState({});
  const [showChart, setShowChart] = useState(false);

  const toggleChart = () => {
    setShowChart(prevShowChart => !prevShowChart); // Toggles the visibility of the chart
  };
  
  
  const handleAddWell = () => {
    if (wellsCount < 15) {
      setWellsCount(wellsCount + 1);
    }
  };


  const handleDropWell = () => {
    if (wellsCount > 1) {
      setWellsCount(wellsCount - 1);
    }
  };


  const handleProteinClick = (protein, index) => {
    // Find the protein's current data including its Rf value
    const proteinData = wellResponses[index].find(p => p.name === protein.name);
    setSelectedProtein({
      ...proteinData,
      rfValue: proteinData.migrationDistance // Assuming migrationDistance is the Rf value
    });
  };
 
  useEffect(() => {
    calculateMigrationDistances();
  }, [acrylamidePercentage]);

// Helper function to sanitize protein names to be used as valid CSS class names
  const sanitizeClassName = (name) => {
    // This example replaces spaces and semicolons with dashes, and removes brackets.
    // You might need to adjust the replacement logic based on actual protein names.
    return name.replace(/[\s;[\]]+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '');
  };

  const updateAnimationStyles = (protein) => {
    const sanitizedProteinName = sanitizeClassName(protein.name);
    const animationName = `moveProteinAfterInitial${sanitizedProteinName}`;

    // Remove any existing style element for this animation
    const existingStyleElement = document.getElementById(animationName);
    if (existingStyleElement) {
      existingStyleElement.parentNode.removeChild(existingStyleElement);
    }

    // Create new keyframes with updated values
    const newKeyframes = `@keyframes ${animationName} {
    from { transform: translateY(58.7px); }
    to { transform: translateY(${protein.migrationDistance * 587}px); }
  }`;

    const newStyleElement = document.createElement("style");
    newStyleElement.id = animationName;
    newStyleElement.innerText = newKeyframes;
    document.head.appendChild(newStyleElement);

    document.querySelectorAll(`.well .protein-${sanitizedProteinName}`).forEach(element => {
      element.style.animation = 'none';

      // Trigger reflow
      void element.offsetWidth;

      // Apply new animation
      element.style.animation = `${animationName} ${protein.remainingDuration}s linear forwards`;
    });
  };


  const calculateMigrationDistances = () => {
    console.log("calculateMigrationDistances function called with acrylamide percentage:", acrylamidePercentage);

    const formula = getFormula(acrylamidePercentage);

    // Updated to iterate over each well in wellResponses
    const updatedWellResponses = Object.entries(wellResponses).reduce((acc, [wellIndex, proteins]) => {
      // Calculate migration distance for each protein in the current well
      const updatedProteins = proteins.map(protein => {
        const logMW = Math.log10(protein.molecularWeight);
        let migrationDistance = formula(logMW);
        migrationDistance = Math.min(migrationDistance, 1); // Ensure migration distance is within bounds

        // Assume updateAnimationStyles needs to be called per protein here as well
        updateAnimationStyles({...protein, migrationDistance});

        return { ...protein, migrationDistance };
      });

      // Accumulate the updated proteins back into an object, keyed by well index
      acc[wellIndex] = updatedProteins;
      return acc;
    }, {});

    console.log("Updated wellResponses:", updatedWellResponses);
    setWellResponses(updatedWellResponses); // Update state with new distances for all wells
  };

  
 


  const getFormula = (percentage) => {
    switch (percentage) {
      case '7.5%':
        return (logMW) => -0.5931 * logMW + 3.2255;
      case '10%':
        return (logMW) => -0.6232 * logMW + 3.3396;
      case '12%':
        return (logMW) => -0.6581 * logMW + 3.4690;
      case '15%':
        return (logMW) => -0.6793 * logMW + 3.5972;
      default:
        return (logMW) => 0;
    }
  };




  const initialMoveDuration = 1;
  const initialMoveDistance = 58.7;

  const startAnimation = () => {
    if (!animationInProgress && isAtStartingPoint) {
      setAnimationInProgress(true);
      setIsAtStartingPoint(false);
      calculateMigrationDistances();

      // Parse the numeric part of the voltageValue state
      const voltage = parseInt(voltageValue.replace('V', ''));
      const baseVoltage = 50; // Base voltage for calculation
      const baseDuration = 10; // Base duration for 50V

      // Calculate the factor by which to divide the base duration
      // This factor doubles for each doubling of the voltage
      const durationFactor = baseVoltage / voltage;

      // Adjusted duration based on the current voltage
      const adjustedDuration = baseDuration * durationFactor;
      console.log(adjustedDuration)
      Object.keys(wellResponses).forEach(wellIndex => {
        wellResponses[wellIndex].forEach(protein => {
          document.querySelectorAll(`.well .protein-${sanitizeClassName(protein.name)}`).forEach(element => {
            element.style.animation = `initialMove ${initialMoveDuration}s linear forwards`;
          });
        });
      });

      setTimeout(() => {
        Object.keys(wellResponses).forEach(wellIndex => {
          wellResponses[wellIndex].forEach(protein => {
            const remainingDistance = protein.migrationDistance * 587; // Assuming 587 is the scaling factor for distance

            document.querySelectorAll(`.well .protein-${sanitizeClassName(protein.name)}`).forEach(element => {
              const animationName = `moveProteinAfterInitial${protein.name.replace(/\s+/g, '-')}`;
              const keyframes = `@keyframes ${animationName} {
              from { transform: translateY(${initialMoveDistance * 587}px); }
              to { transform: translateY(${remainingDistance}px); }
            }`;

              // Append the keyframes if not already present
              if (!document.getElementById(animationName)) {
                const styleSheet = document.createElement("style");
                styleSheet.id = animationName;
                styleSheet.innerText = keyframes;
                document.head.appendChild(styleSheet);
              }

              // Apply the adjusted duration to the animation
              element.style.animation = `${animationName} ${adjustedDuration}s linear forwards`;
            });

            if (protein.name === 'BlueDye') {
              setTimeout(() => {
                setBlueDyeReachedBottom(true);
              }, adjustedDuration * 1000); // Convert the duration from seconds to milliseconds
            }
          });
        });

        setIsAtStartingPoint(false);
      }, initialMoveDuration * 1000); // Convert the duration from seconds to milliseconds
    }
  };

 
  const stopAllProteins = () => {
    Object.keys(wellResponses).forEach(wellIndex => {
      wellResponses[wellIndex].forEach(protein => {
        const elementSelector = `.well .protein-${sanitizeClassName(protein.name)}`;
        document.querySelectorAll(elementSelector).forEach(element => {
          element.style.animationPlayState = 'paused';
        });
      });
      setAnimationInProgress(false);
      setIsAtStartingPoint(false);
      setBlueDyeReachedBottom(true);
    });
  };
 
 
  const handleStop = () => {
    Object.keys(wellResponses).forEach(wellIndex => {
      wellResponses[wellIndex].forEach(protein => {
        document.querySelectorAll(`.well .protein-${sanitizeClassName(protein.name)}`)
            .forEach(element => {
              element.style.animationPlayState = 'paused';
            });
      });
    });
    setAnimationInProgress(false);
  };
 
 
  const handleRefillWells = () => {
    Object.keys(wellResponses).forEach(wellIndex => {
      wellResponses[wellIndex].forEach(protein => {
        document.querySelectorAll(`.well .protein-${sanitizeClassName(protein.name)}`)
            .forEach(element => {
              element.style.animation = 'none';
            });
      });
    });
  
    setAnimationInProgress(false);
    setIsAtStartingPoint(true);
    setBlueDyeReachedBottom(false);
  
    
    calculateMigrationDistances(); 
  };
  
 
 
  const [selectedProteins, setSelectedProteins] = useState(proteinStandards.map(protein => protein.name));


 
  const handleClearWells = () => {
    handleRefillWells()
    setWellResponses({0: initialProteinStandards});
  };


  const handleProteinSelection = (event, proteinName) => {
    if (event.target.checked) {
      setSelectedProteins([...selectedProteins, proteinName]);
    } else {
      setSelectedProteins(selectedProteins.filter(name => name !== proteinName));
    }
  };
 
 
  const handleFileUpload = async (event, wellIndex) => {
    if (event.target.files && event.target.files[0]) {
      const fileToUpload = event.target.files[0];
      console.log("Uploading file...");

      const formData = new FormData();
      formData.append("file", fileToUpload);

      try {
        // Assuming "http://127.0.0.1:8000/1DElectrophoresis/ProteinInfo/File" is your endpoint
        const response = await fetch("http://127.0.0.1:8000/1DElectrophoresis/ProteinInfo/File", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const responseData = await response.json();

          // Store the server response in the wellResponses state, keyed by well index
          setWellResponses(prevResponses => ({
            ...prevResponses,
            [wellIndex]: responseData,
          }));
          console.log(fileToUpload.name + " uploaded successfully for well index "+ wellIndex + ".");
        } else {
          console.error("File upload failed", response.statusText);
        }
      } catch (error) {
        console.error("File upload error:", error);
      }
    }
  };

  return (
    <div className="electrophoresis-wrapper">
      <div className="options-box">
        <div className="control-buttons-container">
          <button onClick={startAnimation} className="control-button" disabled={animationInProgress || blueDyeReachedBottom}>Start</button>
          <button onClick={handleStop} className="control-button" disabled={!animationInProgress || blueDyeReachedBottom}>Stop</button>
          <button onClick={handleRefillWells} className="control-button">Refill Wells</button>
          <button onClick={handleClearWells} className="control-button">Clear Wells</button>
          <button onClick={toggleChart} className="control-button">Plot</button>
        </div>
        <div className='uploadContainer'>
          <label>Folder upload:</label>
          <form className='upload'>
            <div style={{width:20 + 'em', paddingTop:10 + 'px'}}>
              <label htmlFor="uploaded" className="submitUpload">Select Folder</label>
              <input type="file" id="uploaded" webkitdirectory="" />
            </div>
            <input className="submitUpload" type="submit" />
          </form>
        </div>
        <div className="protein-selection">
          {proteinStandards.map((protein, index) => {
              if (protein.name === 'BlueDye') return null;


              return (
                  <div key={index} className="protein-checkbox">
                      <input
                          type="checkbox"
                          id={`protein-${index}`}
                          checked={selectedProteins.includes(protein.name)}
                          onChange={(e) => handleProteinSelection(e, protein.name)}
                          disabled={!isAtStartingPoint} 
                      />
                      <label htmlFor={`protein-${index}`}>{protein.name}</label>
                      <span className='span-color' style={{backgroundColor: protein.color}}></span>
                  </div>
              );
          })}
        </div>
        <label className="voltage-value-label">Voltage: </label>
        <div>
          <select value={voltageValue} onChange={e => setvoltageValue(e.target.value)} className="voltage-dropdown-section">
            <option value="50V">50V</option>
            <option value="100V">100V</option>
            <option value="150V">150V</option>
            <option value="200V">200V</option>
          </select>
        </div>
        <label className="acrylamide-percentage-label">Acrylamide %: </label>
        <div>
          <select 
            value={acrylamidePercentage} 
            onChange={e => setAcrylamidePercentage(e.target.value)}
            disabled={!isAtStartingPoint}
            className="acrylamide-dropdown-section">
            <option value="7.5%">7.5%</option>
            <option value="10%">10%</option>
            <option value="12%">12%</option>
            <option value="15%">15%</option>
          </select>
        </div>
        <label className="wellCountLabel">Current Wells: {wellsCount}</label>
        <div className="buttons-container-1de">
          <button className="button1deadd" onClick={handleAddWell} disabled={wellsCount === 15}>
            Add Well
          </button>
          <button className="button1dedrop" onClick={handleDropWell} disabled={wellsCount === 1}>
            Drop Well
          </button>
        </div>
      </div>
      <div className="onede-box">
        {selectedProtein && (
          <div className="protein-info">
            <button onClick={() => setSelectedProtein(null)} className="close-button">X</button>
            <h3>Protein Information</h3>
            <p>Name: {selectedProtein.name}</p>
            <p>Molecular Weight: {selectedProtein.molecularWeight}</p>
            <p>Rm Value: {(selectedProtein.rfValue * 100).toFixed(2)}%</p> {/* Converts to percentage */}
            <p>
            NCBI Link: <a href={'https://www.ncbi.nlm.nih.gov/protein/' + selectedProtein.id_num} target="_blank" rel="noopener noreferrer">
            {'https://www.ncbi.nlm.nih.gov/protein/' + selectedProtein.id_num}
            </a>
          </p>
          </div>
        )}
        <div className="wires">
          <img src="/blackwirelength.png" alt="Black Wire Extension in Center" className="blackwireextendedmiddle-image" />
          <img src="/redwirelength.png" alt="Red Wire Extension in Center" className="redwireextendedmiddle-image" />
          <img src="/redwirelength.png" alt="Red Wire Extension" className="redwireextendedhorizontal-image" />
          <img src="/blackwirelength.png" alt="Black Wire Extension" className="blackwireextendedhorizontal-image" />
          <img src="/blackwirelength.png" alt="Black Wire Extension" className="blackwireextended-image" />
          <img src="/redwirelength.png" alt="Red Wire Extension" className="redwireextended-image" />
          <img src="/redwire.png" alt="Red Wire" className="redwire-image" />
          <img src="/blackwire.png" alt="Black Wire" className="blackwire-image" />
        </div>
        
        <div className="electrophoresis-cell">
          <div className="wells-container">
            {Array.from({ length: wellsCount }).map((_, idx) => (
              <React.Fragment key={idx}>
                { idx !== 0 && <div className="divider"></div> }
                <div className="well">
                  <form action="/" className="wellForm">
                    <input type="file" className="wellInput" style={{opacity:0, position: "absolute", top:0, left:0, bottom:0, right:0, width:100+"%", height:100+"%"}}
                    onChange={(event) => handleFileUpload(event, idx)} // Pass the well index here
                    />
                  </form>

                  {idx === 0 && selectedProteins.map((proteinName, index) => {
                    const protein = proteinStandards.find(p => p.name === proteinName);
                    if (bandColors[[protein.id_str, protein.id_num]]) protein.color = bandColors[[protein.id_str, protein.id_num]];
                    else bandColors[[protein.id_str, protein.id_num]] = protein.color;
                    return (
                      <div key={index}
                        className={`proteinBand protein-${protein.name.replace(/\s+/g, '-')}`}
                        onClick={() => handleProteinClick(protein, 0)}
                        style={{ cursor: 'pointer', backgroundColor: protein.color }}>
                        {/* Protein band content */}
                      </div>
                    );
                  })}

                  {idx > 0 && wellResponses[idx] && wellResponses[idx].map((protein, proteinIndex) => (
                      <div key={proteinIndex}
                           className={`proteinBand protein-${protein.name.replace(/\s+/g, '-')}`}
                           onClick={() => handleProteinClick(protein, idx)}
                           style={{ cursor: 'pointer', backgroundColor: protein.color }}>
                        {/* Protein band content */}
                      </div>
                  ))}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="acrylamide-gel-top"></div>
        <div className="acrylamide-gel-bottom"></div>


        <label className="acrylamide-label">Acrylamide: {acrylamidePercentage}</label>
        <label className="voltage-label">{voltageValue}</label>
      </div>
      {showChart && (
        <div className="chart-overlay">
          <GoogleScatterChart proteinStandards={proteinStandards} />
          <button className="close-chart" onClick={() => setShowChart(false)}>Close</button>
        </div>
      )}
      <div className="onede-page-instructions-box">
        <h1 className="section-header" id="1de-page-instructions">1DE Simulation Instructions</h1>
        <h2 className="section-header" id="1de-page-instructions">Steps</h2>
        <ol>
          <li>Add or drop wells as desired.</li>
          <li>Click the "Select Folder" button to upload a folder or click a well to upload a file for that well.</li>
          <li>Select/deselect the standards that you would like to run.</li>
          <li>Set the voltage at the desired amount (50/100/150/200V).</li>
          <li>Set the acrylamide percentage at the desired amount (7.5/10/12/15%).</li>
          <li>Click the "Start" button to run the wells.</li>
          <li>Click the "Stop" button to manually stop the wells</li>
          <li>Click the "Refill Wells" button to stop the run and reset the filled wells with the protein bands at their inital position.</li>
        </ol>
        <h2 className="section-header" id="1de-page-instructions">Notes</h2>
        <ul>
          <li>Exact number of wells are not required (if you would like to run 5 wells, you may have 6 or more wells created).</li>
          <li>The dye will always run in every well that is filled.</li>
          <li>The protein bands will automatically stop at their relative migration distance down the well based on the dye.</li>
        </ul>
      </div>
    </div>
  );
}


export default OneDE;



