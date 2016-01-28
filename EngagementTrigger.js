
(function(){
    if(typeof globalEngagementTrigger === 'undefined'){
        window.globalEngagementTrigger = {};
    }
    var engagementTrigger = {
        parameters:{
            debug: globalEngagementTrigger.debugMode || false,
            debugPrefix: "Engagement Trigger",
            cookie:{
                timeOnSite: 0,
                scrollPercentage:0,
                numberOfPageViewsInSession:0,
                isConverted:false
            },
            sessionExpire:globalEngagementTrigger.sessionExpire || 30,
            persistantExpire: globalEngagementTrigger.persistantExpire || 43200,
            pagesCookieName: 'engagement_trigger',
            timeOnSiteInterval: null,
            pageHeight:document.body.clientHeight,
            screenHeight: window.innerHeight,
            scrollArea: (document.body.clientHeight - window.innerHeight),
            allElements: document.getElementsByTagName("*"),
            maxBodyHeight: 0,
            targetPageview: globalEngagementTrigger.targetPageview || 1,
            targetTimeOnPage: globalEngagementTrigger.targetTimeOnPage || 30, // if obTargetTimeOnPage defined before it will take that value, 0 will ignore this
            targetScrollOnPage: globalEngagementTrigger.targetScrollOnPage || 30 // if obTargetScrollOnPage defined before it will take that value, 0 will ignore this
        },
        functions:{
            log:function(message){
                if(engagementTrigger.parameters.debug){
                    console.log(engagementTrigger.parameters.debugPrefix + ": " + message);
                }
            },
            setCookie: function(cname, cvalue, expireMinutes) {
                var d = new Date();
                d.setTime(d.getTime() + (expireMinutes*60*1000));
                var expires = "expires="+d.toUTCString();
                document.cookie = cname + "=" + cvalue + "; " + expires + ';path=/';
            },
            deleteCookie: function(cname){
                engagementTrigger.functions.setCookie(cname, '', -1);
            },
            getCookie: function(cname) {
                var name = cname + "=";
                var ca = document.cookie.split(';');
                for(var i=0; i<ca.length; i++) {
                    var c = ca[i];
                    while (c.charAt(0)==' ') c = c.substring(1);
                    if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
                }
                return "";
            },
            getJson:function(str){
                try {
                    return JSON.parse(str);
                } catch (e) {
                    return {};
                }
            },
            setVariblesFromCookie:function(){
                var cookieData = engagementTrigger.functions.getJson(engagementTrigger.functions.getCookie(engagementTrigger.parameters.pagesCookieName));
                engagementTrigger.parameters.cookie.isConverted = cookieData.isConverted || false;
                var pageVisits = parseInt(cookieData.numberOfPageViewsInSession || engagementTrigger.parameters.cookie.numberOfPageViewsInSession);
                var pageTime = parseInt(cookieData.timeOnSite || engagementTrigger.parameters.cookie.timeOnSite);
                var pageScroll = parseInt(cookieData.scrollPercentage || engagementTrigger.parameters.cookie.scrollPercentage);
                if(!isNaN(pageVisits)){
                    engagementTrigger.parameters.cookie.numberOfPageViewsInSession = pageVisits;
                }
                if(!isNaN(pageTime)){
                    engagementTrigger.parameters.cookie.timeOnSite = pageTime;
                }
                if(!isNaN(pageScroll)){
                    engagementTrigger.parameters.cookie.scrollPercentage = pageScroll;
                }
            },
            setCookieFromVaribles:function(){
                engagementTrigger.functions.setCookie(engagementTrigger.parameters.pagesCookieName, JSON.stringify(engagementTrigger.parameters.cookie), (engagementTrigger.parameters.cookie.isConverted)?engagementTrigger.parameters.persistantExpire: engagementTrigger.parameters.sessionExpire);
            },
            someThingChanged:function(){
                engagementTrigger.functions.log('Change');
                //check if conversion.. and set cookie + SEND EVENT

                if(engagementTrigger.parameters.targetPageview &&
                    engagementTrigger.parameters.targetPageview <= engagementTrigger.parameters.cookie.numberOfPageViewsInSession &&
                    engagementTrigger.parameters.targetTimeOnPage &&
                    engagementTrigger.parameters.targetTimeOnPage <= engagementTrigger.parameters.cookie.timeOnSite &&
                    engagementTrigger.parameters.targetScrollOnPage &&
                    engagementTrigger.parameters.targetScrollOnPage <= engagementTrigger.parameters.cookie.scrollPercentage){
                    engagementTrigger.parameters.cookie.isConverted = true;
                    engagementTrigger.functions.log('User Just got converted');
                    if(typeof dataLayer !== 'undefined'){
                        dataLayer.push({event: 'engagementTrigger'});
                    }
                }
                engagementTrigger.functions.setCookieFromVaribles();
            },
            setScrollParameters:function(){
                for (var i=0; i < engagementTrigger.parameters.allElements.length ; i++) {
                    if(engagementTrigger.parameters.allElements[i].clientHeight > engagementTrigger.parameters.maxBodyHeight){
                        engagementTrigger.parameters.maxBodyHeight = engagementTrigger.parameters.allElements[i].clientHeight;
                    }
                }
                engagementTrigger.parameters.pageHeight = engagementTrigger.parameters.maxBodyHeight;
                engagementTrigger.parameters.scrollArea = engagementTrigger.parameters.pageHeight - window.innerHeight;
            },
            setPagesVisitedInSession:function(){
                engagementTrigger.parameters.cookie.numberOfPageViewsInSession++;
                if(engagementTrigger.parameters.targetPageview && engagementTrigger.parameters.targetPageview >= engagementTrigger.parameters.cookie.numberOfPageViewsInSession){
                    engagementTrigger.functions.someThingChanged();
                    engagementTrigger.functions.log("User has visited " + engagementTrigger.parameters.cookie.numberOfPageViewsInSession + " in the last " + engagementTrigger.parameters.sessionExpire + " Minutes.");
                }
            },
            checkIfScrollExists:function(){
                if(engagementTrigger.parameters.scrollArea <= 0){
                    engagementTrigger.parameters.cookie.scrollPercentage = 100;
                    engagementTrigger.functions.log("User Cannot Horizontal Scroll.");
                }
            },
            setWindowResizeFunction:function(){
                engagementTrigger.parameters.pageHeight = document.body.clientHeight;
                engagementTrigger.parameters.screenHeight = window.innerHeight;
                engagementTrigger.parameters.scrollArea = (document.body.clientHeight - window.innerHeight);
                engagementTrigger.functions.checkIfScrollExists();
                engagementTrigger.functions.someThingChanged();
                engagementTrigger.functions.log("User has resized his Window to: " + window.innerWidth + "X" + window.innerHeight + ".");
            },
            setWindowResizeBinder:function(){
                window.addEventListener("resize", engagementTrigger.functions.setWindowResizeFunction);
            },
            setTimeOnSiteCounterFunction:function(){
                engagementTrigger.parameters.cookie.timeOnSite++;
                if(engagementTrigger.parameters.targetTimeOnPage <= engagementTrigger.parameters.cookie.timeOnSite){
                    clearInterval(engagementTrigger.parameters.timeOnSiteInterval);
                    engagementTrigger.functions.log('Stop time counter interval because it\' got to the target');
                }
                engagementTrigger.functions.someThingChanged();
                engagementTrigger.functions.log("User is on site for " + engagementTrigger.parameters.cookie.timeOnSite + " Seconds.");
            },
            setTimeOnSiteCounter:function(){
                if(engagementTrigger.parameters.targetTimeOnPage && engagementTrigger.parameters.targetTimeOnPage > engagementTrigger.parameters.cookie.timeOnSite){
                    setTimeout(function(){
                        engagementTrigger.parameters.timeOnSiteInterval = setInterval(engagementTrigger.functions.setTimeOnSiteCounterFunction, 1000);
                    }, engagementTrigger.parameters.cookie.timeOnSite * 1000);

                }
            },
            setScrollOnSiteCounterFunction:function(e){
                if(engagementTrigger.parameters.scrollArea > 0 && document.body.scrollTop >=0){
                    var scrollPercentage = parseInt(document.body.scrollTop/engagementTrigger.parameters.scrollArea*100);
                    if(scrollPercentage>engagementTrigger.parameters.cookie.scrollPercentage){
                        engagementTrigger.parameters.cookie.scrollPercentage = scrollPercentage;
                        if(engagementTrigger.parameters.targetScrollOnPage<=engagementTrigger.parameters.cookie.scrollPercentage){
                            window.removeEventListener('resize', engagementTrigger.functions.setWindowResizeFunction);
                            window.removeEventListener('scroll', engagementTrigger.functions.setScrollOnSiteCounterFunction);
                            engagementTrigger.functions.log('Stop scroll events because it\' got to the target');
                        }
                        engagementTrigger.functions.someThingChanged();
                        engagementTrigger.functions.log('User Scrolled Horizontal ' + engagementTrigger.parameters.cookie.scrollPercentage + '%.');
                    }

                }
            },
            setScrollOnSiteCounter:function(){
                if(engagementTrigger.parameters.targetTimeOnPage && engagementTrigger.parameters.targetScrollOnPage >= engagementTrigger.parameters.cookie.scrollPercentage){
                    engagementTrigger.functions.setScrollParameters();
                    engagementTrigger.functions.setWindowResizeBinder();
                    engagementTrigger.functions.checkIfScrollExists();
                    window.addEventListener("scroll", engagementTrigger.functions.setScrollOnSiteCounterFunction);
                }
            }
        },
        init:function(){
            engagementTrigger.functions.setVariblesFromCookie();
            if(engagementTrigger.parameters.cookie.isConverted){
                engagementTrigger.functions.log("User is Converted");
            }else{
                engagementTrigger.functions.setPagesVisitedInSession();
                engagementTrigger.functions.setTimeOnSiteCounter();
                engagementTrigger.functions.setScrollOnSiteCounter();
            }
        }
    }
    engagementTrigger.init();
}());