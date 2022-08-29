var objects = [];
ymaps.ready(init);

function init() {
    var myMap = new ymaps.Map('map', {
        center: [54.9, 27.5],
        controls: ['typeSelector', 'fullscreenControl', 'zoomControl', 'rulerControl'],
        zoom: 10
    }, {
        searchControlProvider: 'yandex#search'
    });
    objectManager = new ymaps.ObjectManager({
        clusterize: true,
        gridSize: 32,
        clusterDisableClickZoom: true,
        clusterIconLayout: "default#pieChart",
        clusterIconPieChartRadius: 15,
        clusterIconPieChartCoreRadius: 10,
        clusterIconPieChartStrokeWidth: 1
    });

    window.myApi.handleUpdate((event, value) => {
        update(value);
        document.getElementById('progress').hidden = true
        document.getElementById('progress-bar').hidden = true
        document.getElementById('label').hidden = true
        myMap.setBounds(myMap.geoObjects.getBounds());
    })
    // gray color for map
    myMap.panes.get('ground').getElement().style.filter = 'grayscale(100%)';
    // add points to map
    myMap.geoObjects.add(objectManager);
}

function changeMarksColor() {
    objectManager.objects.each(function (object) {
        let limitValue = document.getElementById('limitValue');
        let limitValue1 = document.getElementById('limitValue1');
        let limitValue2 = document.getElementById('limitValue2');
        let limitValue3 = document.getElementById('limitValue3');
        let limitValue4 = document.getElementById('limitValue4');
        var content = objectManager.objects.getById(object.id).properties['hintContent'];
        if (content > limitValue.value) {
            objectManager.objects.setObjectOptions(object.id, {
                preset: 'islands#nightCircleDotIconWithCaption'
            });
        } else if (content > limitValue1.value) {
            objectManager.objects.setObjectOptions(object.id, {
                preset: 'islands#darkBlueCircleDotIconWithCaption'
            });
        } else if (content > limitValue2.value) {
            objectManager.objects.setObjectOptions(object.id, {
                preset: 'islands#blueCircleDotIconWithCaption'
            });
        } else if (content > limitValue3.value) {
            objectManager.objects.setObjectOptions(object.id, {
                preset: 'islands#lightBlueCircleDotIconWithCaption'
            });
        } else if (content > limitValue4.value) {
            objectManager.objects.setObjectOptions(object.id, {
                preset: 'islands#darkGreenCircleDotIconWithCaption'
            });
        }
    });
}

function setFilter() {
    objectManager.setFilter(function (object) {
        return object.id % rangeValue.value == 0;
    });
}

function update(coll_points) {
    var currentId = -1;
    var y_map_objects = [];
    objectManager.removeAll();
    coll_points.forEach(item => {
        // Populate the collection with data
        let normMD = item.NormMD * 1000000;
        let latitude = item.lat / 10000000;
        let longitude = item.lon / 10000000;
        y_map_objects.push({
            type: 'Feature',
            id: currentId++,
            geometry: {
                type: 'Point',
                coordinates: [latitude, longitude]
                },
            properties: {
                iconCaption: objects.indexOf(item),
                // Зададим содержимое заголовка балуна.
                balloonContentHeader: `метка # ${currentId} <br/>` +
                `<span class="description">Координаты: lat ${latitude}, lon ${longitude} </span>`,
                // Зададим содержимое основной части балуна.
                balloonContentBody: `<table class="leaflet-container"> 
                <tr><td>MD04:</td><td>${item.MD04} Зв/ч</td></tr>
                <tr><td>MD04e:</td><td>${item.MD04e.toFixed(2)} %</td></tr>
                <tr><td>MD11:</td><td>${item.MD11} Зв/ч</td></tr>
                <tr><td>MD11e:</td><td>${item.MD11e.toFixed(2)} %</td></tr>
                <tr><td>NormMD:</td><td>${item.NormMD} Зв/ч</td></tr>
                <tr><td>NormMDe:</td><td>${item.NormMDe.toFixed(2)} %</td></tr>
                </table>`,
                // Зададим содержимое нижней части балуна.
                balloonContentFooter: 'Информация предоставлена:<br/>OOO "ЮВР"',
                // Зададим содержимое всплывающей подсказки.
                hintContent: normMD,
                clusterCaption: "метка # " + (currentId),
            },
            options: {
                preset: 'islands#nightCircleDotIconWithCaption',
            },
        });
    });
    objectManager.add(y_map_objects);
    changeMarksColor();
    setFilter();
}

