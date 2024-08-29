window.onload = () => {
    let NS = 'http://www.w3.org/2000/svg';
    let u = 1000;

    function Line(x1: number, x2: number, y1: number, y2: number) {
        let line = document.createElementNS(NS, 'line') as SVGLineElement;
        line.setAttribute('x1', `${x1}`);
        line.setAttribute('x2', `${x2}`);
        line.setAttribute('y1', `${y1}`);
        line.setAttribute('y2', `${y2}`);
        return line;
    }

    function setLine(
        line: SVGLineElement,
        x1: number,
        x2: number,
        y1: number,
        y2: number
    ) {
        line.setAttribute('x1', `${x1}`);
        line.setAttribute('x2', `${x2}`);
        line.setAttribute('y1', `${y1}`);
        line.setAttribute('y2', `${y2}`);
    }

    function Text(val: string, x: number, y: number, length?: number) {
        let text = document.createElementNS(NS, 'text') as SVGTextElement;
        text.setAttribute('x', `${x}`);
        text.setAttribute('y', `${y}`);
        text.textContent = val;
        return text;
    }

    function setText(
        text: SVGTextElement,
        val: string,
        x: number,
        y: number,
        length?: number
    ) {
        text.setAttribute('x', `${x}`);
        text.setAttribute('y', `${y}`);
        text.textContent = val;
    }

    function setRect(
        rect: SVGRectElement,
        x: number,
        y: number,
        w: number,
        h: number
    ) {
        rect.setAttribute('x', `${x}`);
        rect.setAttribute('y', `${y}`);
        rect.setAttribute('width', `${w}`);
        rect.setAttribute('height', `${h}`);
    }

    function Circle(cx: number, cy: number, r: number) {
        let circle = document.createElementNS(NS, 'circle') as SVGCircleElement;
        circle.setAttribute('cx', `${cx}`);
        circle.setAttribute('cy', `${cy}`);
        circle.setAttribute('r', `${r}`);
        return circle;
    }

    function getPathString(centres: string[]) {
        let [xs, ys, xe, ye, x1, y1, x2, y2] = centres;
        let d = `m ${xs},${ys} C ${x1} ${y1}, ${x2} ${y2}, ${xe} ${ye}`;
        return d;
    }

    function getCircleCentres(circles: SVGCircleElement[]) {
        let out: string[] = [];
        for (const circle of circles) {
            out.push(
                circle.cx.baseVal.valueAsString,
                circle.cy.baseVal.valueAsString
            );
        }
        return out;
    }

    function clamp(val: number, max: number, min: number = 0) {
        return Math.max(Math.min(val, max), min);
    }

    //only allow n of 2/4/5/8/10/20/25
    function buildGrid(n = 5, size = 20) {
        let h = size / 2;
        let off = (u / n) | 0;
        let sf = (off / u).toFixed(2).at(-1) === '0' ? 1 : 2;

        //yaxis
        let yGridmarkGroup = document.getElementById('yGridmarks');
        let yGridlineGroup = document.getElementById('yGridlines');
        let x1 = 0 - h;
        let x2 = 0 + h;
        for (let i = 0; i <= n; i++) {
            let y = i * off;
            yGridmarkGroup.appendChild(Line(x1, x2, y, y));
            yGridmarkGroup.appendChild(
                Text(`${(1 - y / u).toFixed(sf)}`, x1 - 26, y + 6)
            );
            if (i > 0 && i < n) yGridlineGroup.appendChild(Line(0, u, y, y));
        }

        //xaxis
        let xGridmarkGroup = document.getElementById('xGridmarks');
        let xGridlineGroup = document.getElementById('xGridlines');
        let y1 = 1000 - h;
        let y2 = 1000 + h;
        for (let i = 0; i <= n; i++) {
            let x = i * off;
            xGridmarkGroup.appendChild(Line(x, x, y1, y2));
            xGridmarkGroup.appendChild(
                Text(`${(x / u).toFixed(sf)}`, x - 11, y2 + 18)
            );
            if (i > 0 && i < n) xGridlineGroup.appendChild(Line(x, x, 0, u));
        }
    }

    function buildAnchors(mar: number = 20, car: number = mar) {
        let startAnchor = Circle(0, u, mar);
        let endAnchor = Circle(u, 0, mar);
        let control1Anchor = Circle(u, u, car);
        let control2Anchor = Circle(0, 0, car);
        let svgArea = document.getElementsByTagName('svg')[0];
        let curve = document.getElementById('curve') as any as SVGPathElement;

        let guideLinesGroup = document.createElementNS(NS, 'g') as SVGGElement;
        guideLinesGroup.id = 'guideLinesGroup';
        let control1Line = Line(0, u, u, u);
        let control2Line = Line(0, u, 0, 0);
        let controlLines = [control1Line, control2Line];
        guideLinesGroup.appendChild(control1Line);
        guideLinesGroup.appendChild(control2Line);

        svgArea.appendChild(guideLinesGroup);

        function getMousePosition(evt: MouseEvent) {
            var CTM = svgArea.getScreenCTM();
            return {
                x: (evt.clientX - CTM.e) / CTM.a,
                y: (evt.clientY - CTM.f) / CTM.d,
            };
        }

        let anchorLabel = Text('', 0, 0);
        anchorLabel.id = 'anchorLabel';
        let anchorLabelBackground = document.createElementNS(
            NS,
            'rect'
        ) as SVGRectElement;
        anchorLabelBackground.id = 'anchorLabelBackground';
        let anchorLabelBackgroundPadding = 3;

        let testPoint = svgArea.createSVGPoint();
        let curveThicc = document.getElementById(
            'curveThicc'
        ) as any as SVGPathElement;
        let anchors = [startAnchor, endAnchor, control1Anchor, control2Anchor];

        function isPointInAnchor(x: number, y: number) {
            let cx = 0;
            let cy = 0;
            let pass = false;
            let index = 0;
            for (let i = anchors.length - 1; i >= 0; i--) {
                const anchor = anchors[i];
                cx = anchor.cx.baseVal.value;
                cy = anchor.cy.baseVal.value;
                let r = anchor.r.baseVal.value;
                const distanceSquared = (x - cx) ** 2 + (y - cy) ** 2;
                if (distanceSquared < r ** 2) {
                    pass = true;
                    index = i;
                    break;
                }
            }
            if (pass) return { x: cx, y: cy, i: index };
            else return {};
        }

        function setAnchorLabel(e: MouseEvent) {
            let { x, y } = getMousePosition(e);
            testPoint.x = x;
            testPoint.y = y;
            let { x: ax, y: ay, i } = isPointInAnchor(x, y);
            let inAnchor = ax !== undefined;
            let inCurve = curveThicc.isPointInStroke(testPoint);
            if (inAnchor || inCurve) {
                let variant = 'odd';
                if (inAnchor) {
                    x = ax;
                    y = ay;
                    if (i % 2) variant = 'even';
                } else variant = 'line';
                anchorLabel.classList.add('visible');
                anchorLabel.setAttribute('variant', variant);
                let stringX = (x / 1000).toFixed(2);
                let stringY = (1 - y / 1000).toFixed(2);
                setText(
                    anchorLabel,
                    `(${stringX}, ${stringY})`,
                    x - 55,
                    y - 40
                );
                let bbox = anchorLabel.getBBox();
                anchorLabelBackground.classList.add('visible');
                setRect(
                    anchorLabelBackground,
                    bbox.x - anchorLabelBackgroundPadding,
                    bbox.y - anchorLabelBackgroundPadding,
                    bbox.width + 2 * anchorLabelBackgroundPadding,
                    bbox.height + 2 * anchorLabelBackgroundPadding
                );
            } else {
                anchorLabel.classList.remove('visible');
                anchorLabelBackground.classList.remove('visible');
            }
        }
        svgArea.addEventListener('mousemove', setAnchorLabel);

        let anchorsGroup = document.createElementNS(NS, 'g') as SVGGElement;

        let guideRailsGroup = document.getElementById(
            'guideRails'
        ) as any as SVGGElement;
        let [guideRailx, guideRailY, guideRailXLabel, guideRailYLabel] =
            guideRailsGroup.children as unknown as [
                SVGLineElement,
                SVGLineElement,
                SVGTextElement,
                SVGTextElement
            ];
        let nAnchors = anchors.length / 2;
        let counter = 0;
        let fixedMainAnchors = false;
        let fixedMainAnchorsX = true;
        for (const anchor of anchors) {
            let mainAnchor = counter < nAnchors;
            let anchorIndex = counter % nAnchors;
            let pair = mainAnchor ? counter + nAnchors : counter - nAnchors;
            anchor.addEventListener('mousedown', (e) => {
                e.stopPropagation();

                drag(e);
                guideRailsGroup.classList.add('visible');
                anchorLabel.classList.add('visible');
                anchorLabelBackground.classList.add('visible');

                // function getMousePosition(e: MouseEvent) {
                //     let x = e.clientX - xoff;
                //     let y = e.clientY - yoff;
                //     return { x, y };
                // }

                function updateGuideRails(x: number, y: number) {
                    setLine(guideRailx, x, x, y, u);
                    setLine(guideRailY, 0, x, y, y);
                    let stringX = (x / 1000).toFixed(2);
                    let stringY = (1 - y / 1000).toFixed(2);
                    setText(guideRailXLabel, stringX, x - 17, u + 50);
                    setText(guideRailYLabel, stringY, -80, y + 5);
                    setText(
                        anchorLabel,
                        `(${stringX}, ${stringY})`,
                        x - 55,
                        y - 40
                    );
                    let bbox = anchorLabel.getBBox();
                    setRect(
                        anchorLabelBackground,
                        bbox.x - anchorLabelBackgroundPadding,
                        bbox.y - anchorLabelBackgroundPadding,
                        bbox.width + 2 * anchorLabelBackgroundPadding,
                        bbox.height + 2 * anchorLabelBackgroundPadding
                    );
                }

                function getXY(e: MouseEvent) {
                    let { x, y } = getMousePosition(e);
                    if (mainAnchor && (fixedMainAnchors || fixedMainAnchorsX))
                        x = ((anchorIndex / (nAnchors - 1)) * u) | 0;
                    if (mainAnchor && fixedMainAnchors)
                        y = ((anchorIndex / (nAnchors - 1)) * u) | 0;
                    x = clamp(x, u);
                    y = clamp(y, u);
                    return { x, y };
                }

                function drag(e: MouseEvent) {
                    let { x, y } = getXY(e);
                    anchor.setAttribute('cx', `${x}`);
                    anchor.setAttribute('cy', `${y}`);
                    let line = controlLines[anchorIndex];
                    setLine(
                        line,
                        x,
                        Number(anchors[pair].getAttribute('cx')),
                        y,
                        Number(anchors[pair].getAttribute('cy'))
                    );
                    let cCentres = getCircleCentres(anchors);
                    let pString = getPathString(cCentres);
                    curve.setAttribute('d', pString);
                    curveThicc.setAttribute('d', pString);
                    updateGuideRails(x, y);
                }
                function enddrag() {
                    window.removeEventListener('mousemove', drag);
                    window.removeEventListener('mouseleave', enddrag);
                    window.removeEventListener('mouseup', enddrag);
                    svgArea.addEventListener('mousemove', setAnchorLabel);
                    guideRailsGroup.classList.remove('visible');
                    anchorLabel.classList.remove('visible');
                    anchorLabelBackground.classList.remove('visible');
                }

                window.addEventListener('mousemove', drag);
                window.addEventListener('mouseleave', enddrag);
                window.addEventListener('mouseup', enddrag);
                svgArea.removeEventListener('mousemove', setAnchorLabel);
            });
            anchorsGroup.appendChild(anchor);
            counter++;
        }
        svgArea.appendChild(anchorsGroup);
        svgArea.appendChild(anchorLabelBackground);
        svgArea.appendChild(anchorLabel);
    }

    function start() {
        buildGrid();
        buildAnchors();
    }

    start();
};
