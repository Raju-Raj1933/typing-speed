import { Dialog, DialogTitle } from '@material-ui/core';
import { random, set } from 'lodash';
import React, { createRef, useEffect, useMemo, useRef, useState } from 'react'
import { useGameMode } from '../Context/GameModes';
import CapsLockWarning from './CapsLockWarning';
import Stats from './Stats';
import UpperMenu from './UpperMenu';
var randomWords = require('random-words');

const TypingBox = () => {
    const [currWordIndex, setCurrWordIndex] = useState(0);
    const [currCharIndex, setCurrCharIndex] = useState(0);
    const [countDown, setCountDown] = useState(5);
    const [testStart, setTestStart] = useState(false);
    const [testOver, setTestOver] = useState(false);
    const [capsLocked, setCapsLocked] = useState(false);
    const [correctChar, setCorrectChar] = useState(0);
    const [incorrectChar, setInCorrectChar] = useState(0);
    const [missedChar, setMissedChar] = useState(0);
    const [extraChar, setExtraChar] = useState(0);
    const [correctWords, setCorrectWords] = useState(0);
    const [graphData, setGraphData] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [wordsArray, setWordsArray] = useState(()=>{
        return randomWords(50);
    });
    const [intervalId,setIntervalId] = useState(null);
    const words = useMemo(()=>{
        return wordsArray;
    },[wordsArray]);

    const wordSpanRef = useMemo(()=>{
        return Array(words.length).fill(0).map(i=>createRef());
    }, [words]);

    const {gameTime} = useGameMode();

    const handleDialogEvents = (e)=>{

        if(e.keyCode === 13 || e.keyCode===9){
            e.preventDefault();
            setOpenDialog(false);
            resetGame();
            return;   
        }
        if(e.keyCode===32){
            e.preventDefault();
            setOpenDialog(false);
            redoGame();
            return;
        }
        e.preventDefault();
        setOpenDialog(false);
        focusInput();
        startTimer();
    }

    const redoGame = () =>{
        setCurrCharIndex(0);
        setCurrWordIndex(0);
        setCountDown(gameTime);
        setTestStart(false);
        setTestOver(false);
        clearInterval(intervalId);
        resetWordSpanRef();
        setCorrectChar(0);
        setInCorrectChar(0);
        setCorrectWords(0);
        setExtraChar(0);
        setMissedChar(0);
        setGraphData([]);
        focusInput();
    }


    const resetGame = ()=>{
        console.log("loop");
        setCurrCharIndex(0);
        setCurrWordIndex(0);
        setCountDown(gameTime);
        setTestStart(false);
        setTestOver(false);
        clearInterval(intervalId);
        let random = randomWords(50);
        setWordsArray(random);
        setCorrectChar(0);
        setInCorrectChar(0);
        setCorrectWords(0);
        setExtraChar(0);
        setMissedChar(0);
        setGraphData([]);
        focusInput();
    }

    useEffect(()=>{
        resetGame();
    },[gameTime]);
    const textInputRef = useRef(null);
    const startTimer = ()=>{

        const intervalId = setInterval(timer, 1000);

        setIntervalId(intervalId);
        function timer(){
            console.log("works");
            setCountDown((prevCountDown)=>{
                console.log("prevcount", prevCountDown);
                setCorrectChar((correctChar)=>{
                    console.log("correctchar",correctChar);
                    setGraphData((data)=>{
                        return [...data,[gameTime-prevCountDown,Math.round((correctChar/5)/((gameTime-prevCountDown+1)/60))]];
                    })
                    return correctChar;
                });


                if(prevCountDown===1){
                    clearInterval(intervalId);
                    setCountDown(0);
                    setTestOver(true);             
                }
                else{
                    return prevCountDown-1;
                }
               
            });
        }

    }

    const calculateWPM = ()=>{
        return Math.round((correctChar/5)/(gameTime/60));
    }

    const calculateAccuracy = ()=>{
        return Math.round((correctWords/currWordIndex)*100);
    }



    const handleKeyDown = (e) =>{
        if(e.keyCode===9){

            if(testStart){
                clearInterval(intervalId);
            }
            e.preventDefault();
            setOpenDialog(true);
            return;
        }

        setCapsLocked(e.getModifierState("CapsLock"));

        if(!testStart){
            startTimer();
            setTestStart(true);
        }
        let allSpans = wordSpanRef[currWordIndex].current.querySelectorAll('span');
        if(e.keyCode===32){

            const correctChar = wordSpanRef[currWordIndex].current.querySelectorAll('.correct');
            const incorrectChar = wordSpanRef[currWordIndex].current.querySelectorAll('.incorrect');

            setMissedChar(missedChar+ (allSpans.length-incorrectChar.length-correctChar.length));
            if(correctChar.length===allSpans.length){
                setCorrectWords(correctWords+1);
            }
            if(allSpans.length<=currCharIndex){
                allSpans[currCharIndex-1].className = allSpans[currCharIndex-1].className.replace("right","");
            }
            else{
                allSpans[currCharIndex].className = allSpans[currCharIndex-1].className.replace("current","");
            }
            wordSpanRef[currWordIndex+1].current.querySelectorAll('span')[0].className = 'char current';
            setCurrWordIndex(currWordIndex+1);
            setCurrCharIndex(0);
            return;
        }
        if(e.keyCode===8){
            if(currCharIndex!==0){
                if(currCharIndex===allSpans.length){
                    if(allSpans[currCharIndex-1].className.includes("extra")){
                        allSpans[currCharIndex-1].remove();
                        allSpans[currCharIndex-2].className+=' right';
                    }
                    else{
                        allSpans[currCharIndex-1].className = 'char current';
                    }
                    setCurrCharIndex(currCharIndex-1);
                    return;
                }
                wordSpanRef[currWordIndex].current.querySelectorAll('span')[currCharIndex].className = 'char';
                wordSpanRef[currWordIndex].current.querySelectorAll('span')[currCharIndex-1].className = 'char current';
                setCurrCharIndex(currCharIndex-1);
            }
            return;
        }
        if(e.key.length!==1){
            return;
        }
        if(currCharIndex===allSpans.length){
            let newSpan = document.createElement('span'); // -> <span></span>
            newSpan.innerText = e.key;
            newSpan.className = 'char incorrect right extra';
            setExtraChar(extraChar+1);
            allSpans[currCharIndex-1].className = allSpans[currCharIndex-1].className.replace("right","");

            wordSpanRef[currWordIndex].current.append(newSpan);
            setCurrCharIndex(currCharIndex+1);
            return;
        }
        let key = e.key;
        console.log("key pressed- ",key);
        
        console.log("current character",wordSpanRef[currWordIndex].current.querySelectorAll('span')[currCharIndex].innerText);
        let currentCharacter = wordSpanRef[currWordIndex].current.querySelectorAll('span')[currCharIndex].innerText;

        if(key===currentCharacter){
            console.log("correct key pressed");

            setCorrectChar(correctChar+1);
            wordSpanRef[currWordIndex].current.querySelectorAll('span')[currCharIndex].className = "char correct";
        }
        else{
            setInCorrectChar(incorrectChar+1);
            console.log("incorrect key pressed");
            wordSpanRef[currWordIndex].current.querySelectorAll('span')[currCharIndex].className = "char incorrect";
        }
        if(currCharIndex+1 === wordSpanRef[currWordIndex].current.querySelectorAll('span').length){
            wordSpanRef[currWordIndex].current.querySelectorAll('span')[currCharIndex].className += ' right';
        }
        else{
            wordSpanRef[currWordIndex].current.querySelectorAll('span')[currCharIndex+1].className = 'char current';
        }
        
        setCurrCharIndex(currCharIndex+1);
    }

    const resetWordSpanRef = () =>{
        wordSpanRef.map(i=>{

            Array.from(i.current.childNodes).map(ii=>{
                ii.className = 'char';
            })
        })

        if(wordSpanRef[0]){
            wordSpanRef[0].current.querySelectorAll('span')[0].className = 'char current';
        }
    }

    
    const handleKeyUp = (e) =>{
    }
    
    const focusInput = ()=>{
        textInputRef.current.focus();
    }

    useEffect(()=>{

        focusInput();

        return ()=>{
            clearInterval(intervalId);
        }
    },[]);

    useEffect(()=>{

        resetWordSpanRef();

    },[wordSpanRef]);

  return (
    <div>

            <UpperMenu countDown={countDown}/>

          {!testOver ? (<div className="type-box" onClick={focusInput}>
              <div className="words">
                  {words.map((word, index) => (
                      <span className="word" ref={wordSpanRef[index]}>
                          {word.split("").map((char, ind) => (
                              <span className="char">
                                  {char}
                              </span>
                          ))}
                      </span>
                  ))}

              </div>
          </div>) : (<Stats 
                        wpm={calculateWPM()} 
                        accuracy={calculateAccuracy()} 
                        correctChars={correctChar} 
                        incorrectChars={incorrectChar} 
                        extraChars={extraChar} 
                        missedChars={missedChar} 
                        graphData={graphData}/>)}



        <input 
            type='text'
            className='hidden-input'
            ref={textInputRef}
            onKeyDown={(e)=> handleKeyDown(e)}
            onKeyUp={(e)=> handleKeyUp(e)}
            />

<Dialog
            open={openDialog}
            onKeyDown={handleDialogEvents}
        >
            <DialogTitle>
                <div>
                    press Space to redo
                </div>
                <div>
                    press Tab/Enter to restart
                </div>
                <div>
                    press any other key to exit
                </div>
            </DialogTitle>

        </Dialog>

    </div>
  )
}
export default TypingBox
