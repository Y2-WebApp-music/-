import React, { useContext, useState, useEffect } from "react";
import '../global.css';
import './mainpage.css';
import { auth } from '/src/DB/Firebase-Config.js'
import Thumbnail from "../components/Mainpage/PlanThumbnail";
import ComingPlan from "../components/Mainpage/ComingPlan";
import ThumbnailSkeleton from "../components/Loading/LoadThumbnail";
import ComingSkeleton from "../components/Loading/LoadComing";
import ProfileSkeleton from "../components/Loading/LoadProfile";

function Mainpage(){
    const [userInformation, setUserInformation] = useState({
        uid : null,
        username: null,
        email: null,
        userPhoto: null
    });

    const [comingPlan, setComingPlan] = useState([]);
    const [route, setRoute] = useState([]);

    const [planList, setPlanList] = useState([]);
    const [planOrder, setPlanOrder] = useState(-1);
    const [clickedButton, setClickedButton] = useState("ล่าสุด");
    const [firstEffectCompleted, setFirstEffectCompleted] = useState(false);
    const [checkPlan, setCheckPlan] = useState(false)

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async user => {
            if (user) {
                if (user.photoURL === null){
                    setUserInformation({
                        uid : user.uid,
                        username: user.displayName,
                        email: user.email,
                        userPhoto: '/public/images/user.png'
                    });
                } else {
                    setUserInformation({
                        uid : user.uid,
                        username: user.displayName,
                        email: user.email,
                        userPhoto: user.photoURL
                    });
                }
                let retryCount = 0;
                const maxRetries = 3;
                const fetchPlan = async () => {
                    try {
                        const response = await fetch(`http://localhost:3000/mainpage?uid=${user.uid}&planOrder=${planOrder}`);
                        const plan = await response.json();
                        if (Object.keys(plan).length === 0 && plan.constructor === Object) {
                            retryCount++;
                            if (retryCount <= maxRetries) {
                                setTimeout(fetchPlan, 1000);
                            } else {
                                console.log("Max retries exceeded. Unable to fetch plan.");
                            }
                        } else {
                            setPlanList(plan);
                            setCheckPlan(true)
                            setFirstEffectCompleted(true);
                        }
                    } catch (error) {
                        console.error('Error fetching plan:', error);
                        setTimeout(fetchPlan, 1000);
                    }
                };
                fetchPlan();
            } else {
                console.log('Else condition of 3000/mainpage')
            }
        });
        return () => unsubscribe();
    }, [planOrder]);

    useEffect(() => {
        if (firstEffectCompleted) {
            const unsubscribe = auth.onAuthStateChanged(user => {
                if (user) {
                    try {
                        fetch(`http://localhost:3000/comingplan?uid=${user.uid}`)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Network response was not ok');
                            }
                            return response.json();
                        })
                        .then(plan => {
                            setComingPlan(plan);
                            setRoute(plan.Route)
                        })
                        .then(() => setFirstEffectCompleted(false))
                        .catch(error => console.error('Error fetching or parsing plan:', error));
                    } catch (error) {
                        console.error("Error comingplan documents:", error);
                        throw error;
                    }
                } else { return; }
            });
            return () => unsubscribe();
        }
    }, [firstEffectCompleted]);


    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    const handleOrderSelection = (selectedOrder) => {
        setClickedButton(selectedOrder);
        if (selectedOrder === "ล่าสุด") {
            setPlanOrder(-1);
        } else if (selectedOrder === "เก่าที่สุด") {
            setPlanOrder(1);
        }
    };

    return(
        <>
            <div className="mainPage">
                    <>
                        <div className="sideBar">
                            { userInformation.username != null?(
                                <div className="personalInfo">
                                    <img src={userInformation.userPhoto} alt="Profile" />
                                    <h4>{userInformation.username}</h4>
                                    <p>{userInformation.email}</p>
                                </div>
                            ):(<ProfileSkeleton/>)}
                            <div className="ComingPlan">
                                <p> แพลนที่จะถึงนี้ </p>
                                {checkPlan?(
                                    route.length != 0 ?(
                                        <ComingPlan comingPlan={comingPlan} ListLength={route.length} route={route} />
                                    ):(<>
                                        <div className="ComingIsEmpty"></div>
                                    </>)
                                ):
                                (<ComingSkeleton/>)}
                            </div>
                        </div>
                        <div className="Thumbnail-container">
                            { checkPlan? (
                                planList.length != 0 ?(
                                    < Thumbnail handleOrderSelection={handleOrderSelection} planList={planList} clickedButton={clickedButton} uid={userInformation.uid} setPlanList={setPlanList}/>
                                ):(
                                    <div className="CheckEmptyCreatePlan">
                                        <p>เริ่มสร้างแพลนของคุณ</p>
                                        <a href="/createPlan">สร้างแพลน</a>
                                    </div>
                                )
                            ):
                            (<ThumbnailSkeleton/>)}
                        </div>
                    </>
            </div>
        </>
    )
}

export default Mainpage;