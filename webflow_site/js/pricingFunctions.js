function dom(id) {
    return document.getElementById(id);
};

// event info
var globalGuestsSlider = dom("guests-slider");
var guestsInput = dom("guest-count-input");

// Helper function to get guest count with null check
function getGuestCount() {
    return globalGuestsSlider ? globalGuestsSlider.value || 0 : 0;
}

//total details
var totalCostDisplay = dom("total-cost-display");
var depositDisplay = dom("deposit-display");
if (totalCostDisplay) totalCostDisplay.innerHTML = "$0";
if (depositDisplay) depositDisplay.innerHTML = "$0";

//Calculation
function calculateChange() {
    var eventDateInput = dom("event-date-input");
    var eventDateObject = eventDateInput ? new Date(eventDateInput.value) : new Date();
    var deposit;
    var totalCost;

    //Price element updating
    totalCost = servicesTotal();

    deposit = Math.floor(totalCost * 0.2);
    
    var totalCostDisplay = dom("total-cost-display");
    var totalCostInput = dom("total-cost-input");
    var depositDisplay = dom("deposit-display");
    var depositInput = dom("deposit-input");
    
    if (totalCostDisplay) totalCostDisplay.innerHTML = "$" + totalCost;
    if (totalCostInput) totalCostInput.value = totalCost;
    if (depositDisplay) depositDisplay.innerHTML = "$" + deposit;
    if (depositInput) depositInput.value = deposit;

    //EVENT INFO
    var eventNameInput = dom("event-name-input");
    handleEventInput(
        eventNameInput,
        dom("event-name-display"),
        dom("event-name-display"),
        eventNameInput ? eventNameInput.value : ""
    );

    handleEventInput(
        eventDateInput,
        dom("date-line-item"),
        dom("event-date-display"),
        eventDateObject.toLocaleString("en-US", {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        })
    );

    var startTimeInput = dom("start-time-input");
    handleEventInput(
        startTimeInput,
        dom("start-line-item"),
        dom("start-time-display"),
        startTimeInput ? startTimeInput.value.replace(":00", ":00 ") : ""
    );

    var endTimeInput = dom("end-time-input");
    handleEventInput(
        endTimeInput,
        dom("end-line-item"),
        dom("end-time-display"),
        endTimeInput ? endTimeInput.value.replace(":00", ":00 ") : ""
    );

    // Improved guest handling with null checks
    var guestCount = getGuestCount();
    if (guestsInput) {
        guestsInput.value = guestCount;
    }
    
    var guestCountDisplay = dom("guest-count-display");
    if (guestCountDisplay) {
        guestCountDisplay.innerHTML = guestCount;
    }

    if (guestCount && guestCount !== '0') { 
        var guestsLineItem = dom("guests-line-item");
        if (guestsLineItem) {
            guestsLineItem.style.display = 'flex';
        }
    }
};

function handleEventInput(inputElement, lineElement, contentElement, content) {
    if (inputElement && inputElement.value) { 
        if (lineElement) {
            lineElement.style.display = 'flex';
        }
        if (contentElement) {
            contentElement.innerHTML = content;
        }
    };
};

//------------------------------------FUNCTIONS ----------------------------------------------------

function calculateBaseDayCost() {
    var eventDateInput = dom("event-date-input");
    if (!eventDateInput) return 1500;
    
    var eventDate = new Date(Date.parse(eventDateInput.value));
    var day = eventDate.getDay();

    if (day === 5 || day === 0 ) {
        return 2500;
    } else if (day === 6) {
        return 3000;
    } else {
        return 1500;
    }
};

//SERVICE FUNCTION
function servicesTotal() {
    return services().reduce((partialSum, a) => partialSum + a, 0);
};

function service(config = {}) {
    config['itemType'] = 'service';
    return handleItem(config);
}

function option(config = {}) {
    config['itemType'] = 'option';
    return handleItem(config);
}

function handleItem(config = {}) {
    var defaults = {
        'serviceName': '',
        'optionName': '',
        'type': 'no-cost',
        'cost': 0,
        'guestTiers': false,
        'dayTiers': false,
        'noCheckbox': false,
        'sliderStep': 1,
        'sliderStep2': 1,
        'options': []
    };
    var properties = Object.assign(defaults, config);
    var itemCost = 0;
    var optionName = properties.itemType == 'option' ? '-' + properties.optionName : '';
    var input1 = dom(properties.serviceName + optionName + "-input");
    var input2 = dom(properties.serviceName + optionName + "-input-2");
    var slider1Value = dom(properties.serviceName + optionName + "-slider") ? dom(properties.serviceName + optionName + "-slider").value * properties.sliderStep : 1;
    var slider2Value = dom(properties.serviceName + optionName + "-slider-2") ? dom(properties.serviceName + optionName + "-slider-2").value * properties.sliderStep2 : 1;
    
    var startTimeInput = dom("start-time-input");
    var endTimeInput = dom("end-time-input");
    var globalTime = (startTimeInput && endTimeInput) ? calculateHoursBetween(startTimeInput.value, endTimeInput.value) : 0;
    var guestCount = getGuestCount(); // Use helper function

    if (properties.dayTiers) {
        let numberToDay = {
            0: 'sun',
            1:'mon',
            2: 'tue',
            3: 'wed',
            4: 'thu',
            5: 'fri',
            6:'sat'
        };
        let eventDateInput = dom("event-date-input");
        if (eventDateInput && eventDateInput.value) {
            let eventDate = new Date(Date.parse(eventDateInput.value));
            let dayOfWeekNumber = eventDate.getDay();
            let dayName = numberToDay[dayOfWeekNumber];
            properties.cost = properties.dayTiers[dayName];
        } else {
            properties.cost = 'Choose date';
        }
    }

    //Fixed cost
    if (properties.type == 'fixed') {
        itemCost = properties.cost;
    }

    //Per unit(s) cost
    if (properties.type == 'per-unit') {
        if (input1) { input1.value = slider1Value }
        if (input2) { input2.value = slider2Value }

        itemCost = properties.cost * slider1Value * slider2Value;
    }

    //Global types
    if (properties.type == 'global-time') {
        itemCost = globalTime * properties.cost;
    }
    if (properties.type == 'global-guests') {
        itemCost = guestCount * properties.cost; // Use null-safe guest count
    }
    if (properties.type == 'global-time-and-guests') {
        itemCost = guestCount * globalTime * properties.cost; // Use null-safe guest count
    }

    //Working Hours Fee
    if (properties.type == 'dart-garden-buyout-fee') {
        itemCost = calculateDartGardenBuyoutFee();
    }

    //Guest Tiers
    if (properties.guestTiers) {
        let guestValueToUse = properties.type == 'global-guests' ? guestCount : slider1Value; // Use null-safe guest count

        let sortedGuestTiers = Object.keys(properties.guestTiers).map(key => parseInt(key)).sort((a, b) => a - b);
        itemCost = properties.guestTiers[sortedGuestTiers.at(-1)];
        
        for (let i = 0; i < sortedGuestTiers.length; i++) {
            let key = sortedGuestTiers[i];
            
            if (guestValueToUse <= key) {
                itemCost = properties.guestTiers[key];
                break;
            }
        }
    }
    
    if (properties.itemType == 'service') {
        return handleService(properties, itemCost, 1);
    } else if (properties.itemType == 'option') {
        if (properties.type == 'dart-garden-buyout-fee') {
            return handleMandatoryFee(properties.serviceName, properties.optionName, itemCost);
        } else {
            return handleOption(properties.serviceName, properties.optionName, itemCost);
        }  
    } else {
        try {
            throw new Error(`Not specified if ${properties.serviceName} ${properties.optionName} is a Service or an Option`);
        } catch (e) {
            console.error(e.message);
        }
    }
};

//Dart Garden Buyout Fee
function calculateDartGardenBuyoutFee() {
    // 1) Get the event date
    var eventDateInput = dom("event-date-input");
    const eventDateString = eventDateInput ? eventDateInput.value : "";
    if (!eventDateString) return 0; // no date chosen => no fee

    const eventDate = new Date(eventDateString);
    const dayOfWeek = eventDate.getDay(); 
    // dayOfWeek: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat

    // 2) Determine venue's working hours for the given day
    //    Monday–Thursday => 7 AM – 16 (4 PM)
    //    Friday–Sunday   => 7 AM – 17 (5 PM)
    let venueStartHour = 7;
    let venueEndHour = (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) ? 17 : 16;

    // 3) Parse the event's start/end times in 24-hour format
    var startTimeInput = dom("start-time-input");
    var endTimeInput = dom("end-time-input");
    
    const startTimeString = startTimeInput ? startTimeInput.value : "";
    const endTimeString = endTimeInput ? endTimeInput.value : "";
    
    if (!startTimeString || !endTimeString) return 0;

    const start = parseTimeString(startTimeString); // => { hours, minutes }
    const end   = parseTimeString(endTimeString);   // => { hours, minutes }

    let eventStartHour = start.hours;
    let eventEndHour   = end.hours;

    // 4) Calculate overlap in hours
    const overlapStart = Math.max(eventStartHour, venueStartHour);
    const overlapEnd   = Math.min(eventEndHour, venueEndHour);
    let overlapHours   = overlapEnd - overlapStart;

    // If negative or zero => no overlap
    if (overlapHours <= 0) {
        return 0; 
    }

    // 5) If there is overlap
    //    - Up to 4 hours => $1,000 (half-day)
    //    - Over 4 hours  => $2,000 (full-day)
    if (overlapHours <= 4) {
        return 1000;
    } else {
        return 2000;
    }
}

function handleMandatoryFee(serviceName, optionName, cost, dollarCost = true, showLineItem = true, summaryPrefix = false) {
    var serviceSection = dom(serviceName + "-service-section");
    var optionLineItem
    var displayCost = cost;
    
    if (!summaryPrefix) { summaryPrefix = optionName }
    if (dollarCost) { displayCost = "$" + displayCost };
    optionLineItem = dom(serviceName + '-' + summaryPrefix + "-option-line-item");

    if (serviceSection && cost > 0) {
        addOrShowMandatoryFeeLineItem(serviceName, summaryPrefix, displayCost);
        return cost;
    } else {
        if (optionLineItem) { optionLineItem.style.display = 'none' };
        return 0;
    }
};

function addOrShowMandatoryFeeLineItem(serviceName, optionName, displayCost) {
    var serviceSection = dom(serviceName + "-service-section");
    var optionLineItem = dom(serviceName + '-' + optionName + "-option-line-item");
    var costDisplay = dom(serviceName + '-' + optionName + "-cost-display");

    if (optionLineItem) {
        optionLineItem.style.display = 'flex';
        if (costDisplay) {
            costDisplay.innerHTML = displayCost;
        }
    } else {
        // Create option line item
        optionLineItem = document.createElement('div');
        optionLineItem.id = serviceName + '-' + optionName + '-option-line-item';
        optionLineItem.classList.add('text-meta');
        optionLineItem.style.display = 'flex';
        optionLineItem.style.justifyContent = 'space-between'

        // Create the selection display
        var optionTitleDisplay = document.createElement('div');
        optionTitleDisplay.id = serviceName + '-' + optionName + '-title-display';
        optionTitleDisplay.classList.add('text-meta');
        optionTitleDisplay.textContent = toTitleCase(optionName);

        // Create the cost display
        var costDisplay = document.createElement('h6');
        costDisplay.id = serviceName + '-' + optionName + '-cost-display';
        costDisplay.classList.add('heading-h6');
        costDisplay.innerHTML = displayCost;
        
        optionLineItem.appendChild(optionTitleDisplay);
        optionLineItem.appendChild(costDisplay);
        
        if (serviceSection) {
            serviceSection.appendChild(optionLineItem);
        }
    }
}

//UNEXPOSED FUNCTIONS
//OPTIONS
function handleOption(serviceName, optionName, cost, dollarCost = true, showLineItem = true, summaryPrefix = false) {
    var checkbox = dom(serviceName + '-' + optionName);
    var optionLineItem
    var displayCost = cost;
    
    if (!summaryPrefix) { summaryPrefix = optionName }
    if (dollarCost) { displayCost = "$" + displayCost };
    optionLineItem = dom(serviceName + '-' + summaryPrefix + "-option-line-item");

    if (checkbox && checkbox.checked) {
        addOrShowOption(serviceName, summaryPrefix, displayCost);
        return cost;
    } else {
        if (optionLineItem) { optionLineItem.style.display = 'none' };
        return 0;
    }
};

function addOrShowOption(serviceName, optionName, displayCost) {
    var serviceSection = dom(serviceName + "-service-section");
    var optionLineItem = dom(serviceName + '-' + optionName + "-option-line-item");
    var costDisplay = dom(serviceName + '-' + optionName + "-cost-display");

    if (optionLineItem) {
        optionLineItem.style.display = 'flex';
        if (costDisplay) {
            costDisplay.innerHTML = displayCost;
        }
    } else {
        // Create option line item
        optionLineItem = document.createElement('div');
        optionLineItem.id = serviceName + '-' + optionName + '-option-line-item';
        optionLineItem.classList.add('text-meta');
        optionLineItem.style.display = 'flex';
        optionLineItem.style.justifyContent = 'space-between'

        // Create the selection display
        var optionTitleDisplay = document.createElement('div');
        optionTitleDisplay.id = serviceName + '-' + optionName + '-title-display';
        optionTitleDisplay.classList.add('text-meta');
        optionTitleDisplay.textContent = toTitleCase(optionName);

        // Create the cost display
        var costDisplay = document.createElement('h6');
        costDisplay.id = serviceName + '-' + optionName + '-cost-display';
        costDisplay.classList.add('heading-h6');
        costDisplay.innerHTML = displayCost;
        
        optionLineItem.appendChild(optionTitleDisplay);
        optionLineItem.appendChild(costDisplay);
        
        if (serviceSection) {
            serviceSection.appendChild(optionLineItem);
        }
    }
}

//SERVICES 
function handleService(properties, baseCost, baseTime, addedTime = 0) {
    var checkbox = dom(properties.serviceName);
    var serviceSection = dom(properties.serviceName + "-service-section");
    var optionCheckboxes = dom(properties.serviceName + "-options");
    var displayCost;
    var cost;

    console.log(baseCost)

    if (typeof baseCost === 'string') {
        cost = 0;
        displayCost = baseCost;
    } else {
        cost = calculateServiceTotal(properties.serviceName, baseCost, baseTime, properties.options, addedTime)
        displayCost = "$" + cost;
    }

    if (properties.noCheckbox || (checkbox && checkbox.checked)) {
        addOrShowService(properties.serviceName, displayCost);
        if(optionCheckboxes) { optionCheckboxes.style.display = 'block' };
        return cost;
    } else {
        if (serviceSection) { serviceSection.style.display = 'none' };
        if(optionCheckboxes) { optionCheckboxes.style.display = 'none' };
        return 0;
    }
};

function addOrShowService(serviceName, displayCost) {
    var serviceSection = dom(serviceName + "-service-section");
    var costDisplay = dom(serviceName + "-total-cost-display");

    if (serviceSection) {
        serviceSection.style.display = 'block';
        if (costDisplay) {
            costDisplay.innerHTML = displayCost;
        }
    } else {
        //Create service section
        serviceSection = document.createElement("div");
        serviceSection.id = serviceName + "-service-section";
        serviceSection.className = "hidable-service-section"
        serviceSection.style.display = 'block';

        // Create service line item
        var serviceLineItem = document.createElement('div');
        serviceLineItem.id = serviceName + '-service-line-item';
        serviceLineItem.classList.add('hidable-service-line-item');
        serviceLineItem.style.display = 'flex';
        serviceLineItem.style.justifyContent = 'space-between'

         // Create heading for service
        var serviceHeading = document.createElement('h4');
        serviceHeading.textContent = toTitleCase(serviceName) + ' Total';
        
        // Create the cost display
        var costDisplay = document.createElement('h6');
        costDisplay.id = serviceName + '-total-cost-display';
        costDisplay.classList.add('heading-h6');
        costDisplay.innerHTML = displayCost;

        serviceLineItem.appendChild(serviceHeading);
        serviceLineItem.appendChild(costDisplay);
        serviceSection.appendChild(serviceLineItem);
        
        var servicesSummary = dom('services-summary');
        if (servicesSummary) {
            servicesSummary.appendChild(serviceSection);
        }
    }
};

function toTitleCase(str) {
  return str.replace(/-/g, ' ')                // Replace hyphens with spaces
            .replace(/\b\w/g, function(char) {  // Capitalize the first letter of each word
              return char.toUpperCase();
            });
};

function calculateServiceTotal(serviceName, baseCost, baseTime, optionCosts, addedTime = 0) {
    var costWithAddOns;
    var costMultiplier = 1;

    costMultiplier = (baseTime + addedTime) / baseTime;
    costWithAddOns = !optionCosts ? baseCost : baseCost + optionCosts.reduce((partialSum, a) => partialSum + a, 0);

    return Math.floor(costWithAddOns * costMultiplier);
};

//Global Time Parsing Functions
function parseTimeString(timeString) {
    if (!timeString) return { hours: 0, minutes: 0 };
    
    const [time, modifier] = timeString.split(/(am|pm)/);
    let [hours, minutes] = time.split(':').map(Number);

    if (modifier === 'pm' && hours !== 12) {
        hours += 12;
    }
    if (modifier === 'am' && hours === 12) {
        hours = 0;
    }

    return { hours, minutes };
}

function calculateHoursBetween(startTime, endTime) {
    if (!startTime || !endTime) return 0;
    
    const start = parseTimeString(startTime);
    const end = parseTimeString(endTime);

    let startInMinutes = start.hours * 60 + start.minutes;
    let endInMinutes = end.hours * 60 + end.minutes;

    let diffInMinutes = endInMinutes - startInMinutes;
    if (diffInMinutes < 0) {
        diffInMinutes += 24 * 60; // handle cases where endTime is on the next day
    }

    return diffInMinutes / 60;
}

//After window loads
window.onload = function() {
    var script = document.createElement('script');

    calculateChange();

    script.src = "https://cdn.jsdelivr.net/gh/bencappello/book-santa-barbara/webflow_site/js/dateTimePickers.js?";
    script.onload = function() {
        console.log('Script loaded and executed');
    };
    document.body.appendChild(script);
};