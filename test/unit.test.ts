import { expect, test, describe } from 'vitest'
import { isEqual } from './equal'

const FILENAME = 'test.ts'
describe('Lexer', () => {
  test(`Dynamic import expression range`, async () => {
    const source = `import(("asdf"))  aaaa`
    await isEqual(FILENAME, source)
  })

  test(`Dynamic import expression range 2`, async () => {
    const source = 'import(/* comment */ `asdf` /* comment */)'
    await isEqual(FILENAME, source)
  })

  test(`Dynamic import expression range 3`, async () => {
    const source = 'import(`asdf` // comment\n)'
    await isEqual(FILENAME, source)
  })

  test(`Dynamic import expression range 4`, async () => {
    const source = 'import("foo" + /* comment */ "bar")'
    await isEqual(FILENAME, source)
  })

  test(`Dynamic import expression range 5`, async () => {
    const source = 'import((() => { return "foo" })() /* comment */)'
    await isEqual(FILENAME, source)
  })

  test(`Dynamic import expression range 6`, async () => {
    const source = 'import(/* comment */ `asdf` /* comment */ /* comment 2 */)'
    await isEqual(FILENAME, source)
  })

  // 🟡 `es-module-lexer` seems to be parsed incorrectly.
  test.skip(`Simple export destructuring`, async () => {
    const source = `
      export const{URI,Utils,...Another}=LIB
      export var p, { z } = {};
      export var { aa, qq: { z } } = { qq: {} }, pp = {};
    `
    await isEqual(FILENAME, source)
  })

  test(`Export default cases`, async () => {
    const source = `
          export default "export default a"
          export default "export default 'a'"
          export default "export function foo() {}"
          export default "export function foo() {return bar}"
        `
    await isEqual(FILENAME, source)
  })

  test(`import.meta spread`, async () => {
    const source = `console.log(...import.meta.obj);`
    await isEqual(FILENAME, source)
  })

  test(`Template string default bracket`, async () => {
    const source = `export default{};`
    await isEqual(FILENAME, source)
  })

  test(`Template string default`, async () => {
    const source = `const css = String.raw;
        export default css\`:host { solid 1px black }\`;`
    await isEqual(FILENAME, source)
  })

  test('Class fn ASI', async () => {
    const source = `class a{friendlyName;import}n();`
    await isEqual(FILENAME, source)
  })

  test('Division const after class parse case', async () => {
    const source = `class a{}const Ti=a/yi;`
    await isEqual(FILENAME, source)
  })

  test('Multiline dynamic import on windows', async () => {
    const source = `import(\n"./statehash\\u1011.js"\r)`
    await isEqual(FILENAME, source)
  })

  test('Basic nested dynamic import support', async () => {
    const source = `await import (await import  ('foo'))`
    await isEqual(FILENAME, source)
  })

  // 🟡 [ write `with` on the second line ]
  //    ↑ This syntax is not supported in TypeScript, but is supported in Babel (use '@babel/plugin-syntax-import-attributes' plugin)
  //      because swc basically follows the TS, so we ignore this case.
  test('Import assertions', async () => {
    const source = `
      import json from "./foo.json" with { type: "json" };
      import("foo.json" , { with: { type: "json" } });

      import test from './asdf'
        // 🟡
        // with { not: 'an assertion!' }
      export var p = 5;
    `
    await isEqual(FILENAME, source)
  })

  // 🟡 ↑ lbid.
  test('Import attributes', async () => {
    const source = `
import json from "./foo.json" with { type: "json" };
import("foo.json" , { with: { type: "json" } });
import test from './asdf'
  // 🟡
  // with { not: 'an assertion!' }
export var p = 5;
    `
    await isEqual(FILENAME, source)
  })

  test('Import meta inside dynamic import', async () => {
    const source = `import(import.meta.url)`
    await isEqual(FILENAME, source)
  })

  test('Export', async () => {
    const source = `export var p=5`
    await isEqual(FILENAME, source)
  })

  test('String encoding', async () => {
    const source = `
      import './\\x61\\x62\\x63.js';
      import './\\u{20204}.js';
      import('./\\u{20204}.js');
      import('./\\u{20204}.js' + dyn);
      import('./\\u{20204}.js' );
      import('./\\u{20204}.js' ());
    `
    await isEqual(FILENAME, source)
  })

  test('Regexp case', async () => {
    const source = `
      class Number {

      }

      /("|')(?<value>(\\\\(\\1)|[^\\1])*)?(\\1)/.exec(\`'\\\\"\\\\'aa'\`);

      const x = \`"\${label.replace(/"/g, "\\\\\\"")}"\`
    `
    await isEqual(FILENAME, source)
  })

  test('Regexp default export', async () => {
    const source = `
      export default /[\`]/
      export default 1/2
      export default /* asdf */ 1/2
      export default /* asdf */ /regex/
      export default
      // line comment
      /regex/
      export default
      // line comment
      1 / 2
    `
    await isEqual(FILENAME, source)
  })

  test('Regexp keyword prefixes', async () => {
    const source = `
      x: while (true) {
        if (foo) break
        /import("a")/.test(bar) || baz()
        if (foo) continue
        /import("b")/.test(bar) || baz()
        if (foo) break x
        /import("c")/.test(bar) || baz()
        if (foo) continue x
        /import("d")/.test(bar) || baz()
      }
    `
    await isEqual(FILENAME, source)
  })

  test('Regexp division', async () => {
    const source = `\nconst x = num / /'/.exec(l)[0].slice(1, -1)//'"`
    await isEqual(FILENAME, source)
  })

  test('Multiline string escapes', async () => {
    const source =
      "const str = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAABmJLR0QA/wAAAAAzJ3zzAAAGTElEQV\\\r\n\t\tRIx+VXe1BU1xn/zjn7ugvL4sIuQnll5U0ELAQxig7WiQYz6NRHa6O206qdSXXSxs60dTK200zNY9q0dcRpMs1jkrRNWmaijCVoaU';\r\n"
    await isEqual(FILENAME, source)
  })

  test('Dotted number', async () => {
    const source = `
       const x = 5. / 10;
    `
    await isEqual(FILENAME, source)
  })

  test('Division operator case', async () => {
    const source = `
      function log(r){
        if(g>=0){u[g++]=m;g>=n.logSz&&(g=0)}else{u.push(m);u.length>=n.logSz&&(g=0)}/^(DBG|TICK): /.test(r)||t.Ticker.tick(454,o.slice(0,200));
      }

      (function(n){
      })();
    `
    await isEqual(FILENAME, source)
  })

  test('Single parse cases', async () => {
    await isEqual(FILENAME, `export { x }`)
    await isEqual(FILENAME, `'asdf'`)
    await isEqual(FILENAME, `/asdf/`)
    await isEqual(FILENAME, `\`asdf\``)
    await isEqual(FILENAME, `/**/`)
    await isEqual(FILENAME, `//`)
  })

  test('Simple export with unicode conversions', async () => {
    const source = `export var p𓀀s,q`
    await isEqual(FILENAME, source)
  })

  test('Simple import', async () => {
    const source = `
      import test from "test";
      console.log(test);
    `
    await isEqual(FILENAME, source)
  })

  test('Empty single quote string import', async () => {
    const source = `import ''`
    await isEqual(FILENAME, source)
  })

  test('Empty double quote string import', async () => {
    const source = `import ""`
    await isEqual(FILENAME, source)
  })

  test('Import/Export with comments', async () => {
    const source = `

      import/* 'x' */ 'a';

      import /* 'x' */ 'b';

      export var z  /*  */
      export {
        a,
        // b,
        /* c */ d
      };
    `
    await isEqual(FILENAME, source)
  })

  test('Exported function and class', async () => {
    const source = `
      export function a𓀀 () {

      }
      export class Q{

      }
    `
    await isEqual(FILENAME, source)
  })

  test('Export destructuring', async () => {
    const source = `
      export const { a, b } = foo;
      export const [ c, d ] = bar;

      export { ok };
    `
    await isEqual(FILENAME, source)
  })

  test('Minified import syntax', async () => {
    const source = `import{TemplateResult as t}from"lit-html";import{a as e}from"./chunk-4be41b30.js";export{j as SVGTemplateResult,i as TemplateResult,g as html,h as svg}from"./chunk-4be41b30.js";window.JSCompiler_renameProperty='asdf';`
    await isEqual(FILENAME, source)
  })

  test('More minified imports', async () => {
    const source = `import"some/import.js";`
    await isEqual(FILENAME, source)
  })

  test('plus plus division', async () => {
    await isEqual(
      FILENAME,
      `
      tick++/fetti;f=(1)+")";
    `,
    )
  })

  test('return bracket division', async () => {
    const source = `function variance(){return s/(a-1)}`
    await isEqual(FILENAME, source)
  })

  test('Simple reexport', async () => {
    const source = `
      export { hello as default } from "test-dep";
    `
    await isEqual(FILENAME, source)
  })

  test('import.meta', async () => {
    const source = `
      export var hello = 'world';
      console.log(import.meta.url);
    `
    await isEqual(FILENAME, source)
  })

  test('import meta edge cases', async () => {
    const source = `
      // Import meta
      import.
       meta
      // Not import meta
      a.
      import.
        meta
    `
    await isEqual(FILENAME, source)
  })

  test('dynamic import method', async () => {
    const source = `
      class A {
        import() {
        }
      }
    `
    await isEqual(FILENAME, source)
  })

  test('dynamic import edge cases', async () => {
    const source = `
      ({
        // not a dynamic import!
        import(not1) {}
      });
      {
        // is a dynamic import!
        import(is1);
      }
      a.
      // not a dynamic import!
      import(not2);
      a.
      b()
      // is a dynamic import!
      import(is2);

      const myObject = {
        import: ()=> import(some_url)
      }
    `
    await isEqual(FILENAME, source)
  })

  test('import after code', async () => {
    const source = `
      export function f () {
        g();
      }

      import { g } from './test-circular2.js';
    `
    await isEqual(FILENAME, source)
  })

  // 🟡 cannot declare a anonymous function in global scope
  test('Comments', async () => {
    const source = `/*
    VERSION
  */import util from 'util';

//
function x() {
}

      /**/
      // '
      /* / */
      /*

         * export { b }
      \\*/export { a }

// 🟡 
//      function () {
//        /***/
//      }
    `
    await isEqual(FILENAME, source)
  })

  // 👀 es-module-lexer bug, should not contain a `;`
  test('Strings', async () => {
    const source = `
      "";
      \`
        \${
          import(\`test/\${ import(b)}\`) /*
              \`  }
          */
        }
      \`
      export { a }
    `
    await isEqual(FILENAME, source)
  })

  test('Bracket matching', async () => {
    await isEqual(
      FILENAME,
      `
      instance.extend('parseExprAtom', function (nextMethod) {
        return function () {
          function parseExprAtom(refDestructuringErrors) {
            if (this.type === tt._import) {
              return parseDynamicImport.call(this);
            }
            return c(refDestructuringErrors);
          }
        }();
      });
      export { a }
    `,
    )
  })

  test('Division / Regex ambiguity', async () => {
    const source = `
      /as)df/; x();
      a / 2; '  /  '
      while (true)
        /test'/
      x-/a'/g
      try {}
      finally{}/a'/g
      (x);{f()}/d'export { b }/g
      ;{}/e'/g;
      {}/f'/g
      a / 'b' / c;
      /a'/ - /b'/;
      +{} /g -'/g'
      ('a')/h -'/g'
      if //x
      ('a')/i'/g;
      /asdf/ / /as'df/; // '
      p = \`\${/test/ + 5}\`;
      /regex/ / x;
      function m() {
        return /*asdf8*// 5/;
      }
      export { a };
    `
    await isEqual(FILENAME, source)
  })

  test('Template string expression ambiguity', async () => {
    const source = `
      \`$\`
      import 'a';
      \`\`
      export { b };
      \`a$b\`
      import(\`$\`);
      \`{$}\`
    `
    await isEqual(FILENAME, source)
  })

  test('many exports', async () => {
    await isEqual(
      FILENAME,
      `
      export { _iconsCache as fas, prefix, faAbacus, faAcorn, faAd, faAddressBook, faAddressCard, faAdjust, faAirFreshener, faAlarmClock, faAlarmExclamation, faAlarmPlus, faAlarmSnooze, faAlicorn, faAlignCenter, faAlignJustify, faAlignLeft, faAlignRight, faAlignSlash, faAllergies, faAmbulance, faAmericanSignLanguageInterpreting, faAnalytics, faAnchor, faAngel, faAngleDoubleDown, faAngleDoubleLeft, faAngleDoubleRight, faAngleDoubleUp, faAngleDown, faAngleLeft, faAngleRight, faAngleUp, faAngry, faAnkh, faAppleAlt, faAppleCrate, faArchive, faArchway, faArrowAltCircleDown, faArrowAltCircleLeft, faArrowAltCircleRight, faArrowAltCircleUp, faArrowAltDown, faArrowAltFromBottom, faArrowAltFromLeft, faArrowAltFromRight, faArrowAltFromTop, faArrowAltLeft, faArrowAltRight, faArrowAltSquareDown, faArrowAltSquareLeft, faArrowAltSquareRight, faArrowAltSquareUp, faArrowAltToBottom, faArrowAltToLeft, faArrowAltToRight, faArrowAltToTop, faArrowAltUp, faArrowCircleDown, faArrowCircleLeft, faArrowCircleRight, faArrowCircleUp, faArrowDown, faArrowFromBottom, faArrowFromLeft, faArrowFromRight, faArrowFromTop, faArrowLeft, faArrowRight, faArrowSquareDown, faArrowSquareLeft, faArrowSquareRight, faArrowSquareUp, faArrowToBottom, faArrowToLeft, faArrowToRight, faArrowToTop, faArrowUp, faArrows, faArrowsAlt, faArrowsAltH, faArrowsAltV, faArrowsH, faArrowsV, faAssistiveListeningSystems, faAsterisk, faAt, faAtlas, faAtom, faAtomAlt, faAudioDescription, faAward, faAxe, faAxeBattle, faBaby, faBabyCarriage, faBackpack, faBackspace, faBackward, faBacon, faBadge, faBadgeCheck, faBadgeDollar, faBadgePercent, faBadgerHoney, faBagsShopping, faBalanceScale, faBalanceScaleLeft, faBalanceScaleRight, faBallPile, faBallot, faBallotCheck, faBan, faBandAid, faBarcode, faBarcodeAlt, faBarcodeRead, faBarcodeScan, faBars, faBaseball, faBaseballBall, faBasketballBall, faBasketballHoop, faBat, faBath, faBatteryBolt, faBatteryEmpty, faBatteryFull, faBatteryHalf, faBatteryQuarter, faBatterySlash, faBatteryThreeQuarters, faBed, faBeer, faBell, faBellExclamation, faBellPlus, faBellSchool, faBellSchoolSlash, faBellSlash, faBells, faBezierCurve, faBible, faBicycle, faBiking, faBikingMountain, faBinoculars, faBiohazard, faBirthdayCake, faBlanket, faBlender, faBlenderPhone, faBlind, faBlog, faBold, faBolt, faBomb, faBone, faBoneBreak, faBong, faBook, faBookAlt, faBookDead, faBookHeart, faBookMedical, faBookOpen, faBookReader, faBookSpells, faBookUser, faBookmark, faBooks, faBooksMedical, faBoot, faBoothCurtain, faBorderAll, faBorderBottom, faBorderCenterH, faBorderCenterV, faBorderInner, faBorderLeft, faBorderNone, faBorderOuter, faBorderRight, faBorderStyle, faBorderStyleAlt, faBorderTop, faBowArrow, faBowlingBall, faBowlingPins, faBox, faBoxAlt, faBoxBallot, faBoxCheck, faBoxFragile, faBoxFull, faBoxHeart, faBoxOpen, faBoxUp, faBoxUsd, faBoxes, faBoxesAlt, faBoxingGlove, faBrackets, faBracketsCurly, faBraille, faBrain, faBreadLoaf, faBreadSlice, faBriefcase, faBriefcaseMedical, faBringForward, faBringFront, faBroadcastTower, faBroom, faBrowser, faBrush, faBug, faBuilding, faBullhorn, faBullseye, faBullseyeArrow, faBullseyePointer, faBurgerSoda, faBurn, faBurrito, faBus, faBusAlt, faBusSchool, faBusinessTime, faCabinetFiling, faCalculator, faCalculatorAlt, faCalendar, faCalendarAlt, faCalendarCheck, faCalendarDay, faCalendarEdit, faCalendarExclamation, faCalendarMinus, faCalendarPlus, faCalendarStar, faCalendarTimes, faCalendarWeek, faCamera, faCameraAlt, faCameraRetro, faCampfire, faCampground, faCandleHolder, faCandyCane, faCandyCorn, faCannabis, faCapsules, faCar, faCarAlt, faCarBattery, faCarBuilding, faCarBump, faCarBus, faCarCrash, faCarGarage, faCarMechanic, faCarSide, faCarTilt, faCarWash, faCaretCircleDown, faCaretCircleLeft, faCaretCircleRight, faCaretCircleUp, faCaretDown, faCaretLeft, faCaretRight, faCaretSquareDown, faCaretSquareLeft, faCaretSquareRight, faCaretSquareUp, faCaretUp, faCarrot, faCars, faCartArrowDown, faCartPlus, faCashRegister, faCat, faCauldron, faCertificate, faChair, faChairOffice, faChalkboard, faChalkboardTeacher, faChargingStation, faChartArea, faChartBar, faChartLine, faChartLineDown, faChartNetwork, faChartPie, faChartPieAlt, faChartScatter, faCheck, faCheckCircle, faCheckDouble, faCheckSquare, faCheese, faCheeseSwiss, faCheeseburger, faChess, faChessBishop, faChessBishopAlt, faChessBoard, faChessClock, faChessClockAlt, faChessKing, faChessKingAlt, faChessKnight, faChessKnightAlt, faChessPawn, faChessPawnAlt, faChessQueen, faChessQueenAlt, faChessRook, faChessRookAlt, faChevronCircleDown, faChevronCircleLeft, faChevronCircleRight, faChevronCircleUp, faChevronDoubleDown, faChevronDoubleLeft, faChevronDoubleRight, faChevronDoubleUp, faChevronDown, faChevronLeft, faChevronRight, faChevronSquareDown, faChevronSquareLeft, faChevronSquareRight, faChevronSquareUp, faChevronUp, faChild, faChimney, faChurch, faCircle, faCircleNotch, faCity, faClawMarks, faClinicMedical, faClipboard, faClipboardCheck, faClipboardList, faClipboardListCheck, faClipboardPrescription, faClipboardUser, faClock, faClone, faClosedCaptioning, faCloud, faCloudDownload, faCloudDownloadAlt, faCloudDrizzle, faCloudHail, faCloudHailMixed, faCloudMeatball, faCloudMoon, faCloudMoonRain, faCloudRain, faCloudRainbow, faCloudShowers, faCloudShowersHeavy, faCloudSleet, faCloudSnow, faCloudSun, faCloudSunRain, faCloudUpload, faCloudUploadAlt, faClouds, faCloudsMoon, faCloudsSun, faClub, faCocktail, faCode, faCodeBranch, faCodeCommit, faCodeMerge, faCoffee, faCoffeeTogo, faCoffin, faCog, faCogs, faCoin, faCoins, faColumns, faComment, faCommentAlt, faCommentAltCheck, faCommentAltDollar, faCommentAltDots, faCommentAltEdit, faCommentAltExclamation, faCommentAltLines, faCommentAltMedical, faCommentAltMinus, faCommentAltPlus, faCommentAltSlash, faCommentAltSmile, faCommentAltTimes, faCommentCheck, faCommentDollar, faCommentDots, faCommentEdit, faCommentExclamation, faCommentLines, faCommentMedical, faCommentMinus, faCommentPlus, faCommentSlash, faCommentSmile, faCommentTimes, faComments, faCommentsAlt, faCommentsAltDollar, faCommentsDollar, faCompactDisc, faCompass, faCompassSlash, faCompress, faCompressAlt, faCompressArrowsAlt, faCompressWide, faConciergeBell, faConstruction, faContainerStorage, faConveyorBelt, faConveyorBeltAlt, faCookie, faCookieBite, faCopy, faCopyright, faCorn, faCouch, faCow, faCreditCard, faCreditCardBlank, faCreditCardFront, faCricket, faCroissant, faCrop, faCropAlt, faCross, faCrosshairs, faCrow, faCrown, faCrutch, faCrutches, faCube, faCubes, faCurling, faCut, faDagger, faDatabase, faDeaf, faDebug, faDeer, faDeerRudolph, faDemocrat, faDesktop, faDesktopAlt, faDewpoint, faDharmachakra, faDiagnoses, faDiamond, faDice, faDiceD10, faDiceD12, faDiceD20, faDiceD4, faDiceD6, faDiceD8, faDiceFive, faDiceFour, faDiceOne, faDiceSix, faDiceThree, faDiceTwo, faDigging, faDigitalTachograph, faDiploma, faDirections, faDisease, faDivide, faDizzy, faDna, faDoNotEnter, faDog, faDogLeashed, faDollarSign, faDolly, faDollyEmpty, faDollyFlatbed, faDollyFlatbedAlt, faDollyFlatbedEmpty, faDonate, faDoorClosed, faDoorOpen, faDotCircle, faDove, faDownload, faDraftingCompass, faDragon, faDrawCircle, faDrawPolygon, faDrawSquare, faDreidel, faDrone, faDroneAlt, faDrum, faDrumSteelpan, faDrumstick, faDrumstickBite, faDryer, faDryerAlt, faDuck, faDumbbell, faDumpster, faDumpsterFire, faDungeon, faEar, faEarMuffs, faEclipse, faEclipseAlt, faEdit, faEgg, faEggFried, faEject, faElephant, faEllipsisH, faEllipsisHAlt, faEllipsisV, faEllipsisVAlt, faEmptySet, faEngineWarning, faEnvelope, faEnvelopeOpen, faEnvelopeOpenDollar, faEnvelopeOpenText, faEnvelopeSquare, faEquals, faEraser, faEthernet, faEuroSign, faExchange, faExchangeAlt, faExclamation, faExclamationCircle, faExclamationSquare, faExclamationTriangle, faExpand, faExpandAlt, faExpandArrows, faExpandArrowsAlt, faExpandWide, faExternalLink, faExternalLinkAlt, faExternalLinkSquare, faExternalLinkSquareAlt, faEye, faEyeDropper, faEyeEvil, faEyeSlash, faFan, faFarm, faFastBackward, faFastForward, faFax, faFeather, faFeatherAlt, faFemale, faFieldHockey, faFighterJet, faFile, faFileAlt, faFileArchive, faFileAudio, faFileCertificate, faFileChartLine, faFileChartPie, faFileCheck, faFileCode, faFileContract, faFileCsv, faFileDownload, faFileEdit, faFileExcel, faFileExclamation, faFileExport, faFileImage, faFileImport, faFileInvoice, faFileInvoiceDollar, faFileMedical, faFileMedicalAlt, faFileMinus, faFilePdf, faFilePlus, faFilePowerpoint, faFilePrescription, faFileSearch, faFileSignature, faFileSpreadsheet, faFileTimes, faFileUpload, faFileUser, faFileVideo, faFileWord, faFilesMedical, faFill, faFillDrip, faFilm, faFilmAlt, faFilter, faFingerprint, faFire, faFireAlt, faFireExtinguisher, faFireSmoke, faFireplace, faFirstAid, faFish, faFishCooked, faFistRaised, faFlag, faFlagAlt, faFlagCheckered, faFlagUsa, faFlame, faFlask, faFlaskPoison, faFlaskPotion, faFlower, faFlowerDaffodil, faFlowerTulip, faFlushed, faFog, faFolder, faFolderMinus, faFolderOpen, faFolderPlus, faFolderTimes, faFolderTree, faFolders, faFont, faFontAwesomeLogoFull, faFontCase, faFootballBall, faFootballHelmet, faForklift, faForward, faFragile, faFrenchFries, faFrog, faFrostyHead, faFrown, faFrownOpen, faFunction, faFunnelDollar, faFutbol, faGameBoard, faGameBoardAlt, faGamepad, faGasPump, faGasPumpSlash, faGavel, faGem, faGenderless, faGhost, faGift, faGiftCard, faGifts, faGingerbreadMan, faGlass, faGlassChampagne, faGlassCheers, faGlassCitrus, faGlassMartini, faGlassMartiniAlt, faGlassWhiskey, faGlassWhiskeyRocks, faGlasses, faGlassesAlt, faGlobe, faGlobeAfrica, faGlobeAmericas, faGlobeAsia, faGlobeEurope, faGlobeSnow, faGlobeStand, faGolfBall, faGolfClub, faGopuram, faGraduationCap, faGreaterThan, faGreaterThanEqual, faGrimace, faGrin, faGrinAlt, faGrinBeam, faGrinBeamSweat, faGrinHearts, faGrinSquint, faGrinSquintTears, faGrinStars, faGrinTears, faGrinTongue, faGrinTongueSquint, faGrinTongueWink, faGrinWink, faGripHorizontal, faGripLines, faGripLinesVertical, faGripVertical, faGuitar, faHSquare, faH1, faH2, faH3, faH4, faHamburger, faHammer, faHammerWar, faHamsa, faHandHeart, faHandHolding, faHandHoldingBox, faHandHoldingHeart, faHandHoldingMagic, faHandHoldingSeedling, faHandHoldingUsd, faHandHoldingWater, faHandLizard, faHandMiddleFinger, faHandPaper, faHandPeace, faHandPointDown, faHandPointLeft, faHandPointRight, faHandPointUp, faHandPointer, faHandReceiving, faHandRock, faHandScissors, faHandSpock, faHands, faHandsHeart, faHandsHelping, faHandsUsd, faHandshake, faHandshakeAlt, faHanukiah, faHardHat, faHashtag, faHatChef, faHatSanta, faHatWinter, faHatWitch, faHatWizard, faHaykal, faHdd, faHeadSide, faHeadSideBrain, faHeadSideMedical, faHeadVr, faHeading, faHeadphones, faHeadphonesAlt, faHeadset, faHeart, faHeartBroken, faHeartCircle, faHeartRate, faHeartSquare, faHeartbeat, faHelicopter, faHelmetBattle, faHexagon, faHighlighter, faHiking, faHippo, faHistory, faHockeyMask, faHockeyPuck, faHockeySticks, faHollyBerry, faHome, faHomeAlt, faHomeHeart, faHomeLg, faHomeLgAlt, faHoodCloak, faHorizontalRule, faHorse, faHorseHead, faHospital, faHospitalAlt, faHospitalSymbol, faHospitalUser, faHospitals, faHotTub, faHotdog, faHotel, faHourglass, faHourglassEnd, faHourglassHalf, faHourglassStart, faHouseDamage, faHouseFlood, faHryvnia, faHumidity, faHurricane, faICursor, faIceCream, faIceSkate, faIcicles, faIcons, faIconsAlt, faIdBadge, faIdCard, faIdCardAlt, faIgloo, faImage, faImages, faInbox, faInboxIn, faInboxOut, faIndent, faIndustry, faIndustryAlt, faInfinity, faInfo, faInfoCircle, faInfoSquare, faInhaler, faIntegral, faIntersection, faInventory, faIslandTropical, faItalic, faJackOLantern, faJedi, faJoint, faJournalWhills, faKaaba, faKerning, faKey, faKeySkeleton, faKeyboard, faKeynote, faKhanda, faKidneys, faKiss, faKissBeam, faKissWinkHeart, faKite, faKiwiBird, faKnifeKitchen, faLambda, faLamp, faLandmark, faLandmarkAlt, faLanguage, faLaptop, faLaptopCode, faLaptopMedical, faLaugh, faLaughBeam, faLaughSquint, faLaughWink, faLayerGroup, faLayerMinus, faLayerPlus, faLeaf, faLeafHeart, faLeafMaple, faLeafOak, faLemon, faLessThan, faLessThanEqual, faLevelDown, faLevelDownAlt, faLevelUp, faLevelUpAlt, faLifeRing, faLightbulb, faLightbulbDollar, faLightbulbExclamation, faLightbulbOn, faLightbulbSlash, faLightsHoliday, faLineColumns, faLineHeight, faLink, faLips, faLiraSign, faList, faListAlt, faListOl, faListUl, faLocation, faLocationArrow, faLocationCircle, faLocationSlash, faLock, faLockAlt, faLockOpen, faLockOpenAlt, faLongArrowAltDown, faLongArrowAltLeft, faLongArrowAltRight, faLongArrowAltUp, faLongArrowDown, faLongArrowLeft, faLongArrowRight, faLongArrowUp, faLoveseat, faLowVision, faLuchador, faLuggageCart, faLungs, faMace, faMagic, faMagnet, faMailBulk, faMailbox, faMale, faMandolin, faMap, faMapMarked, faMapMarkedAlt, faMapMarker, faMapMarkerAlt, faMapMarkerAltSlash, faMapMarkerCheck, faMapMarkerEdit, faMapMarkerExclamation, faMapMarkerMinus, faMapMarkerPlus, faMapMarkerQuestion, faMapMarkerSlash, faMapMarkerSmile, faMapMarkerTimes, faMapPin, faMapSigns, faMarker, faMars, faMarsDouble, faMarsStroke, faMarsStrokeH, faMarsStrokeV, faMask, faMeat, faMedal, faMedkit, faMegaphone, faMeh, faMehBlank, faMehRollingEyes, faMemory, faMenorah, faMercury, faMeteor, faMicrochip, faMicrophone, faMicrophoneAlt, faMicrophoneAltSlash, faMicrophoneSlash, faMicroscope, faMindShare, faMinus, faMinusCircle, faMinusHexagon, faMinusOctagon, faMinusSquare, faMistletoe, faMitten, faMobile, faMobileAlt, faMobileAndroid, faMobileAndroidAlt, faMoneyBill, faMoneyBillAlt, faMoneyBillWave, faMoneyBillWaveAlt, faMoneyCheck, faMoneyCheckAlt, faMoneyCheckEdit, faMoneyCheckEditAlt, faMonitorHeartRate, faMonkey, faMonument, faMoon, faMoonCloud, faMoonStars, faMortarPestle, faMosque, faMotorcycle, faMountain, faMountains, faMousePointer, faMug, faMugHot, faMugMarshmallows, faMugTea, faMusic, faNarwhal, faNetworkWired, faNeuter, faNewspaper, faNotEqual, faNotesMedical, faObjectGroup, faObjectUngroup, faOctagon, faOilCan, faOilTemp, faOm, faOmega, faOrnament, faOtter, faOutdent, faOverline, faPageBreak, faPager, faPaintBrush, faPaintBrushAlt, faPaintRoller, faPalette, faPallet, faPalletAlt, faPaperPlane, faPaperclip, faParachuteBox, faParagraph, faParagraphRtl, faParking, faParkingCircle, faParkingCircleSlash, faParkingSlash, faPassport, faPastafarianism, faPaste, faPause, faPauseCircle, faPaw, faPawAlt, faPawClaws, faPeace, faPegasus, faPen, faPenAlt, faPenFancy, faPenNib, faPenSquare, faPencil, faPencilAlt, faPencilPaintbrush, faPencilRuler, faPennant, faPeopleCarry, faPepperHot, faPercent, faPercentage, faPersonBooth, faPersonCarry, faPersonDolly, faPersonDollyEmpty, faPersonSign, faPhone, faPhoneAlt, faPhoneLaptop, faPhoneOffice, faPhonePlus, faPhoneSlash, faPhoneSquare, faPhoneSquareAlt, faPhoneVolume, faPhotoVideo, faPi, faPie, faPig, faPiggyBank, faPills, faPizza, faPizzaSlice, faPlaceOfWorship, faPlane, faPlaneAlt, faPlaneArrival, faPlaneDeparture, faPlay, faPlayCircle, faPlug, faPlus, faPlusCircle, faPlusHexagon, faPlusOctagon, faPlusSquare, faPodcast, faPodium, faPodiumStar, faPoll, faPollH, faPollPeople, faPoo, faPooStorm, faPoop, faPopcorn, faPortrait, faPoundSign, faPowerOff, faPray, faPrayingHands, faPrescription, faPrescriptionBottle, faPrescriptionBottleAlt, faPresentation, faPrint, faPrintSearch, faPrintSlash, faProcedures, faProjectDiagram, faPumpkin, faPuzzlePiece, faQrcode, faQuestion, faQuestionCircle, faQuestionSquare, faQuidditch, faQuoteLeft, faQuoteRight, faQuran, faRabbit, faRabbitFast, faRacquet, faRadiation, faRadiationAlt, faRainbow, faRaindrops, faRam, faRampLoading, faRandom, faReceipt, faRectangleLandscape, faRectanglePortrait, faRectangleWide, faRecycle, faRedo, faRedoAlt, faRegistered, faRemoveFormat, faRepeat, faRepeat1, faRepeat1Alt, faRepeatAlt, faReply, faReplyAll, faRepublican, faRestroom, faRetweet, faRetweetAlt, faRibbon, faRing, faRingsWedding, faRoad, faRobot, faRocket, faRoute, faRouteHighway, faRouteInterstate, faRss, faRssSquare, faRubleSign, faRuler, faRulerCombined, faRulerHorizontal, faRulerTriangle, faRulerVertical, faRunning, faRupeeSign, faRv, faSack, faSackDollar, faSadCry, faSadTear, faSalad, faSandwich, faSatellite, faSatelliteDish, faSausage, faSave, faScalpel, faScalpelPath, faScanner, faScannerKeyboard, faScannerTouchscreen, faScarecrow, faScarf, faSchool, faScrewdriver, faScroll, faScrollOld, faScrubber, faScythe, faSdCard, faSearch, faSearchDollar, faSearchLocation, faSearchMinus, faSearchPlus, faSeedling, faSendBack, faSendBackward, faServer, faShapes, faShare, faShareAll, faShareAlt, faShareAltSquare, faShareSquare, faSheep, faShekelSign, faShield, faShieldAlt, faShieldCheck, faShieldCross, faShip, faShippingFast, faShippingTimed, faShishKebab, faShoePrints, faShoppingBag, faShoppingBasket, faShoppingCart, faShovel, faShovelSnow, faShower, faShredder, faShuttleVan, faShuttlecock, faSickle, faSigma, faSign, faSignIn, faSignInAlt, faSignLanguage, faSignOut, faSignOutAlt, faSignal, faSignal1, faSignal2, faSignal3, faSignal4, faSignalAlt, faSignalAlt1, faSignalAlt2, faSignalAlt3, faSignalAltSlash, faSignalSlash, faSignature, faSimCard, faSitemap, faSkating, faSkeleton, faSkiJump, faSkiLift, faSkiing, faSkiingNordic, faSkull, faSkullCrossbones, faSlash, faSledding, faSleigh, faSlidersH, faSlidersHSquare, faSlidersV, faSlidersVSquare, faSmile, faSmileBeam, faSmilePlus, faSmileWink, faSmog, faSmoke, faSmoking, faSmokingBan, faSms, faSnake, faSnooze, faSnowBlowing, faSnowboarding, faSnowflake, faSnowflakes, faSnowman, faSnowmobile, faSnowplow, faSocks, faSolarPanel, faSort, faSortAlphaDown, faSortAlphaDownAlt, faSortAlphaUp, faSortAlphaUpAlt, faSortAlt, faSortAmountDown, faSortAmountDownAlt, faSortAmountUp, faSortAmountUpAlt, faSortDown, faSortNumericDown, faSortNumericDownAlt, faSortNumericUp, faSortNumericUpAlt, faSortShapesDown, faSortShapesDownAlt, faSortShapesUp, faSortShapesUpAlt, faSortSizeDown, faSortSizeDownAlt, faSortSizeUp, faSortSizeUpAlt, faSortUp, faSoup, faSpa, faSpaceShuttle, faSpade, faSparkles, faSpellCheck, faSpider, faSpiderBlackWidow, faSpiderWeb, faSpinner, faSpinnerThird, faSplotch, faSprayCan, faSquare, faSquareFull, faSquareRoot, faSquareRootAlt, faSquirrel, faStaff, faStamp, faStar, faStarAndCrescent, faStarChristmas, faStarExclamation, faStarHalf, faStarHalfAlt, faStarOfDavid, faStarOfLife, faStars, faSteak, faSteeringWheel, faStepBackward, faStepForward, faStethoscope, faStickyNote, faStocking, faStomach, faStop, faStopCircle, faStopwatch, faStore, faStoreAlt, faStream, faStreetView, faStretcher, faStrikethrough, faStroopwafel, faSubscript, faSubway, faSuitcase, faSuitcaseRolling, faSun, faSunCloud, faSunDust, faSunHaze, faSunglasses, faSunrise, faSunset, faSuperscript, faSurprise, faSwatchbook, faSwimmer, faSwimmingPool, faSword, faSwords, faSynagogue, faSync, faSyncAlt, faSyringe, faTable, faTableTennis, faTablet, faTabletAlt, faTabletAndroid, faTabletAndroidAlt, faTabletRugged, faTablets, faTachometer, faTachometerAlt, faTachometerAltAverage, faTachometerAltFast, faTachometerAltFastest, faTachometerAltSlow, faTachometerAltSlowest, faTachometerAverage, faTachometerFast, faTachometerFastest, faTachometerSlow, faTachometerSlowest, faTaco, faTag, faTags, faTally, faTanakh, faTape, faTasks, faTasksAlt, faTaxi, faTeeth, faTeethOpen, faTemperatureFrigid, faTemperatureHigh, faTemperatureHot, faTemperatureLow, faTenge, faTennisBall, faTerminal, faText, faTextHeight, faTextSize, faTextWidth, faTh, faThLarge, faThList, faTheaterMasks, faThermometer, faThermometerEmpty, faThermometerFull, faThermometerHalf, faThermometerQuarter, faThermometerThreeQuarters, faTheta, faThumbsDown, faThumbsUp, faThumbtack, faThunderstorm, faThunderstormMoon, faThunderstormSun, faTicket, faTicketAlt, faTilde, faTimes, faTimesCircle, faTimesHexagon, faTimesOctagon, faTimesSquare, faTint, faTintSlash, faTire, faTireFlat, faTirePressureWarning, faTireRugged, faTired, faToggleOff, faToggleOn, faToilet, faToiletPaper, faToiletPaperAlt, faTombstone, faTombstoneAlt, faToolbox, faTools, faTooth, faToothbrush, faTorah, faToriiGate, faTornado, faTractor, faTrademark, faTrafficCone, faTrafficLight, faTrafficLightGo, faTrafficLightSlow, faTrafficLightStop, faTrain, faTram, faTransgender, faTransgenderAlt, faTrash, faTrashAlt, faTrashRestore, faTrashRestoreAlt, faTrashUndo, faTrashUndoAlt, faTreasureChest, faTree, faTreeAlt, faTreeChristmas, faTreeDecorated, faTreeLarge, faTreePalm, faTrees, faTriangle, faTrophy, faTrophyAlt, faTruck, faTruckContainer, faTruckCouch, faTruckLoading, faTruckMonster, faTruckMoving, faTruckPickup, faTruckPlow, faTruckRamp, faTshirt, faTty, faTurkey, faTurtle, faTv, faTvRetro, faUmbrella, faUmbrellaBeach, faUnderline, faUndo, faUndoAlt, faUnicorn, faUnion, faUniversalAccess, faUniversity, faUnlink, faUnlock, faUnlockAlt, faUpload, faUsdCircle, faUsdSquare, faUser, faUserAlt, faUserAltSlash, faUserAstronaut, faUserChart, faUserCheck, faUserCircle, faUserClock, faUserCog, faUserCrown, faUserEdit, faUserFriends, faUserGraduate, faUserHardHat, faUserHeadset, faUserInjured, faUserLock, faUserMd, faUserMdChat, faUserMinus, faUserNinja, faUserNurse, faUserPlus, faUserSecret, faUserShield, faUserSlash, faUserTag, faUserTie, faUserTimes, faUsers, faUsersClass, faUsersCog, faUsersCrown, faUsersMedical, faUtensilFork, faUtensilKnife, faUtensilSpoon, faUtensils, faUtensilsAlt, faValueAbsolute, faVectorSquare, faVenus, faVenusDouble, faVenusMars, faVial, faVials, faVideo, faVideoPlus, faVideoSlash, faVihara, faVoicemail, faVolcano, faVolleyballBall, faVolume, faVolumeDown, faVolumeMute, faVolumeOff, faVolumeSlash, faVolumeUp, faVoteNay, faVoteYea, faVrCardboard, faWalker, faWalking, faWallet, faWand, faWandMagic, faWarehouse, faWarehouseAlt, faWasher, faWatch, faWatchFitness, faWater, faWaterLower, faWaterRise, faWaveSine, faWaveSquare, faWaveTriangle, faWebcam, faWebcamSlash, faWeight, faWeightHanging, faWhale, faWheat, faWheelchair, faWhistle, faWifi, faWifi1, faWifi2, faWifiSlash, faWind, faWindTurbine, faWindWarning, faWindow, faWindowAlt, faWindowClose, faWindowMaximize, faWindowMinimize, faWindowRestore, faWindsock, faWineBottle, faWineGlass, faWineGlassAlt, faWonSign, faWreath, faWrench, faXRay, faYenSign, faYinYang };
    `,
    )
  })

  test('Empty export', async () => {
    const source = `
      export {};
    `
    await isEqual(FILENAME, source)
  })

  test('Export * as', async () => {
    const source = `
      export * as X from './asdf';
      export *  as  yy from './g';
    `
    await isEqual(FILENAME, source)
  })
})

describe('Import From', () => {
  test('non-identifier-string as (doubleQuote)', async () => {
    const source = `
      import { "~123" as foo0 } from './mod0.js';
      import { "ab cd" as foo1 } from './mod1.js';
      import { "not identifier" as foo2 } from './mod2.js';
      import { "-notidentifier" as foo3 } from './mod3.js';
      import { "%notidentifier" as foo4 } from './mod4.js';
      import { "@notidentifier" as foo5 } from './mod5.js';
      import { " notidentifier" as foo6 } from './mod6.js';
      import { "notidentifier " as foo7 } from './mod7.js';
      import { " notidentifier " as foo8 } from './mod8.js';
      import { /** @type{HTMLElement} */ LionCombobox } from './src/LionCombobox.js';
      `
    await isEqual(FILENAME, source)
  })

  test('non-identifier-string as (singleQuote)', async () => {
    const source = `
      import { '~123' as foo0 } from './mod0.js';
      import { 'ab cd' as foo1 } from './mod1.js';
      import { 'not identifier' as foo2 } from './mod2.js';
      import { '-notidentifier' as foo3 } from './mod3.js';
      import { '%notidentifier' as foo4 } from './mod4.js';
      import { '@notidentifier' as foo5 } from './mod5.js';
      import { ' notidentifier' as foo6 } from './mod6.js';
      import { 'notidentifier ' as foo7 } from './mod7.js';
      import { ' notidentifier ' as foo8 } from './mod8.js';`
    await isEqual(FILENAME, source)
  })

  test('with-backslash-keywords as (doubleQuote)', async () => {
    const source = String.raw`
    import { " slash\\ " as foo0 } from './mod0.js';
    import { " quote\" " as foo1 } from './mod1.js'
    import { " quote\\\" " as foo2 } from './mod2.js';
    import { " quote' " as foo3 } from './mod3.js';`
    await isEqual(FILENAME, source)
  })

  test('with-backslash-keywords as (singleQuote)', async () => {
    const source = String.raw`
    import { ' slash\\ ' as foo0 } from './mod0.js';
    import { ' quote\' ' as foo1 } from './mod1.js'
    import { ' quote\\\' ' as foo2 } from './mod2.js';
    import { ' quote\' ' as foo3 } from './mod3.js';`
    await isEqual(FILENAME, source)
  })

  test('with-emoji as', async () => {
    const source = `
      import { "hm🤔" as foo0 } from './mod0.js';
      import { " 🚀rocket space " as foo1 } from './mod1.js';`
    await isEqual(FILENAME, source)
  })

  // 🤔 TS not support this syntax
  // test('double-quotes-and-curly-bracket', async () => {
  //   const source = `
  //     import { asdf as "b} from 'wrong'" } from 'mod0';`
  //   await isEqual(FILENAME, source)
  // })

  // 🤔 TS not support this syntax
  // test('single-quotes-and-curly-bracket', async () => {
  //   const source = `
  //     import { asdf as 'b} from "wrong"' } from 'mod0';`
  //   await isEqual(FILENAME, source)
  // })
})

describe('Export From', () => {
  test('Identifier only', async () => {
    const source = `
      export { x } from './asdf';
      export { x1, x2 } from './g';
      export { foo, x2 as bar, zoo } from './g2';
      export { /** @type{HTMLElement} */ LionCombobox } from './src/LionCombobox.js';
    `
    await isEqual(FILENAME, source)
  })

  test('non-identifier-string as variable (doubleQuote)', async () => {
    const source = `
      export { "~123" as foo0 } from './mod0.js';
      export { "ab cd" as foo1 } from './mod1.js';
      export { "not identifier" as foo2 } from './mod2.js';
      export { "-notidentifier" as foo3 } from './mod3.js';
      export { "%notidentifier" as foo4 } from './mod4.js';
      export { "@notidentifier" as foo5 } from './mod5.js';
      export { " notidentifier" as foo6 } from './mod6.js';
      export { "notidentifier " as foo7 } from './mod7.js';
      export { " notidentifier " as foo8 } from './mod8.js';`
    await isEqual(FILENAME, source)
  })

  test('non-identifier-string as variable (singleQuote)', async () => {
    const source = `
      export { '~123' as foo0 } from './mod0.js';
      export { 'ab cd' as foo1 } from './mod1.js';
      export { 'not identifier' as foo2 } from './mod2.js';
      export { '-notidentifier' as foo3 } from './mod3.js';
      export { '%notidentifier' as foo4 } from './mod4.js';
      export { '@notidentifier' as foo5 } from './mod5.js';
      export { ' notidentifier' as foo6 } from './mod6.js';
      export { 'notidentifier ' as foo7 } from './mod7.js';
      export { ' notidentifier ' as foo8 } from './mod8.js';`
    await isEqual(FILENAME, source)
  })

  test('with-backslash-keywords as variable (doubleQuote)', async () => {
    const source = String.raw`
      export { " slash\\ " as foo0 } from './mod0.js';
      export { " quote\" " as foo1 } from './mod1.js'
      export { " quote\\\" " as foo2 } from './mod2.js';
      export { " quote' " as foo3 } from './mod3.js';`
    await isEqual(FILENAME, source)
  })

  test('with-backslash-keywords as variable (singleQuote)', async () => {
    const source = String.raw`
      export { ' slash\\ ' as foo0 } from './mod0.js';
      export { ' quote\' ' as foo1 } from './mod1.js'
      export { ' quote\\\' ' as foo2 } from './mod2.js';
      export { ' quote\' ' as foo3 } from './mod3.js';`
    await isEqual(FILENAME, source)
  })

  test('with-emoji as', async () => {
    const source = `
      export { "hm🤔" as foo0 } from './mod0.js';
      export { " 🚀rocket space " as foo1 } from './mod1.js';`
    await isEqual(FILENAME, source)
  })

  test('non-identifier-string (doubleQuote)', async () => {
    const source = `
      export { "~123" } from './mod0.js';
      export { "ab cd" } from './mod1.js';
      export { "not identifier" } from './mod2.js';
      export { "-notidentifier" } from './mod3.js';
      export { "%notidentifier" } from './mod4.js';
      export { "@notidentifier" } from './mod5.js';
      export { " notidentifier" } from './mod6.js';
      export { "notidentifier " } from './mod7.js';
      export { " notidentifier " } from './mod8.js';`
    await isEqual(FILENAME, source)
  })

  test('non-identifier-string (singleQuote)', async () => {
    const source = `
      export { '~123' } from './mod0.js';
      export { 'ab cd' } from './mod1.js';
      export { 'not identifier' } from './mod2.js';
      export { '-notidentifier' } from './mod3.js';
      export { '%notidentifier' } from './mod4.js';
      export { '@notidentifier' } from './mod5.js';
      export { ' notidentifier' } from './mod6.js';
      export { 'notidentifier ' } from './mod7.js';
      export { ' notidentifier ' } from './mod8.js';`
    await isEqual(FILENAME, source)
  })

  test('with-backslash-keywords (doubleQuote)', async () => {
    const source = String.raw`
      export { " slash\\ " } from './mod0.js';
      export { " quote\" " } from './mod1.js'
      export { " quote\\\" " } from './mod2.js';
      export { " quote' " } from './mod3.js';`
    await isEqual(FILENAME, source)
  })

  test('with-backslash-keywords (singleQuote)', async () => {
    const source = String.raw`
      export { ' slash\\ ' } from './mod0.js';
      export { ' quote\' ' } from './mod1.js'
      export { ' quote\\\' ' } from './mod2.js';
      export { ' quote\' ' } from './mod3.js';`
    await isEqual(FILENAME, source)
  })

  test('variable as non-identifier-string (doubleQuote)', async () => {
    const source = `
      export { foo0 as "~123" } from './mod0.js';
      export { foo1 as "ab cd" } from './mod1.js';
      export { foo2 as "not identifier" } from './mod2.js';
      export { foo3 as "-notidentifier" } from './mod3.js';
      export { foo4 as "%notidentifier" } from './mod4.js';
      export { foo5 as "@notidentifier" } from './mod5.js';
      export { foo6 as " notidentifier" } from './mod6.js';
      export { foo7 as "notidentifier " } from './mod7.js';
      export { foo8 as " notidentifier " } from './mod8.js';`
    await isEqual(FILENAME, source)
  })

  test('variable as non-identifier-string (singleQuote)', async () => {
    const source = `
      export { foo0 as '~123' } from './mod0.js';
      export { foo1 as 'ab cd' } from './mod1.js';
      export { foo2 as 'not identifier' } from './mod2.js';
      export { foo3 as '-notidentifier' } from './mod3.js';
      export { foo4 as '%notidentifier' } from './mod4.js';
      export { foo5 as '@notidentifier' } from './mod5.js';
      export { foo6 as ' notidentifier' } from './mod6.js';
      export { foo7 as 'notidentifier ' } from './mod7.js';
      export { foo8 as ' notidentifier ' } from './mod8.js';`
    await isEqual(FILENAME, source)
  })

  test('variable as with-backslash-keywords (doubleQuote)', async () => {
    const source = String.raw`
    export { foo0 as " slash\\ " } from './mod0.js';
    export { foo1 as " quote\" " } from './mod1.js'
    export { foo2 as " quote\\\" " } from './mod2.js';
    export { foo3 as " quote' " } from './mod3.js';`
    await isEqual(FILENAME, source)
  })

  test('variable as with-backslash-keywords (singleQuote)', async () => {
    const source = String.raw`
    export { foo0 as ' slash\\ ' } from './mod0.js';
    export { foo1 as ' quote\' ' } from './mod1.js'
    export { foo2 as ' quote\\\' ' } from './mod2.js';
    export { foo3 as ' quote\' ' } from './mod3.js';`
    await isEqual(FILENAME, source)
  })

  test('non-identifier-string as non-identifier-string (doubleQuote)', async () => {
    const source = `
      export { "~123" as "~123" } from './mod0.js';
      export { "ab cd" as "ab cd" } from './mod1.js';
      export { "not identifier" as "not identifier" } from './mod2.js';
      export { "-notidentifier" as "-notidentifier" } from './mod3.js';
      export { "%notidentifier" as "%notidentifier" } from './mod4.js';
      export { "@notidentifier" as "@notidentifier" } from './mod5.js';
      export { " notidentifier" as " notidentifier" } from './mod6.js';
      export { "notidentifier " as "notidentifier " } from './mod7.js';
      export { " notidentifier " as " notidentifier " } from './mod8.js';`
    await isEqual(FILENAME, source)
  })

  test('non-identifier-string as non-identifier-string (singleQuote)', async () => {
    const source = `
      export { '~123' as '~123' } from './mod0.js';
      export { 'ab cd' as 'ab cd' } from './mod1.js';
      export { 'not identifier' as 'not identifier' } from './mod2.js';
      export { '-notidentifier' as '-notidentifier' } from './mod3.js';
      export { '%notidentifier' as '%notidentifier' } from './mod4.js';
      export { '@notidentifier' as '@notidentifier' } from './mod5.js';
      export { ' notidentifier' as ' notidentifier' } from './mod6.js';
      export { 'notidentifier ' as 'notidentifier ' } from './mod7.js';
      export { ' notidentifier ' as ' notidentifier ' } from './mod8.js';`
    await isEqual(FILENAME, source)
  })

  test('with-backslash-keywords as with-backslash-keywords (doubleQuote)', async () => {
    const source = String.raw`
    export { " slash\\ " as " slash\\ " } from './mod0.js';
    export { " quote\"" as " quote\" " } from './mod1.js'
    export { " quote\\\" " as " quote\\\" " } from './mod2.js';
    export { " quote' " as " quote' " } from './mod3.js';`
    await isEqual(FILENAME, source)
  })

  test('with-backslash-keywords as with-backslash-keywords (singleQuote)', async () => {
    const source = String.raw`
    export { ' slash\\ ' as ' slash\\ ' } from './mod0.js';
    export { ' quote\'' as ' quote\' ' } from './mod1.js'
    export { ' quote\\\' ' as ' quote\\\' ' } from './mod2.js';
    export { ' quote\' ' as ' quote\' ' } from './mod3.js';`
    await isEqual(FILENAME, source)
  })

  test('curly-brace (doubleQuote)', async () => {
    const source = `
      export { " right-curlybrace} " } from './mod0.js';
      export { " {left-curlybrace " } from './mod1.js';
      export { " {curlybrackets} " } from './mod2.js';
      export { ' right-curlybrace} ' } from './mod0.js';
      export { ' {left-curlybrace ' } from './mod1.js';
      export { ' {curlybrackets} ' } from './mod2.js';`
    await isEqual(FILENAME, source)
  })

  test('* as curly-brace (doubleQuote)', async () => {
    const source = `
      export { foo as " right-curlybrace} " } from './mod0.js';
      export { foo as " {left-curlybrace " } from './mod1.js';
      export { foo as " {curlybrackets} " } from './mod2.js';
      export { foo as ' right-curlybrace} ' } from './mod0.js';
      export { foo as ' {left-curlybrace ' } from './mod1.js';
      export { foo as ' {curlybrackets} ' } from './mod2.js';`
    await isEqual(FILENAME, source)
  })

  test('curly-brace as curly-brace (doubleQuote)', async () => {
    const source = `
      export { " right-curlybrace} " as " right-curlybrace} " } from './mod0.js';
      export { " {left-curlybrace " as " {left-curlybrace " } from './mod1.js';
      export { " {curlybrackets} " as " {curlybrackets} " } from './mod2.js';
      export { ' right-curlybrace} ' as ' right-curlybrace} ' } from './mod0.js';
      export { ' {left-curlybrace ' as ' {left-curlybrace ' } from './mod1.js';
      export { ' {curlybrackets} ' as ' {curlybrackets} ' } from './mod2.js';`
    await isEqual(FILENAME, source)
  })

  test('complex & edge cases', async () => {
    const source = `
      export {
        foo,
        foo1 as foo2,
        " {left-curlybrace ",
        " {curly-brackets}" as "@notidentifier",
        "?" as "identifier",
      } from './mod0.js';
      export { "p as 'z' from 'asdf'" as "z'" } from 'asdf';
      export { "z'" as "p as 'z' from 'asdf'" } from 'asdf';`
    await isEqual(FILENAME, source)
  })
})

describe('Facade', () => {
  test('facade', async () => {
    await isEqual(
      FILENAME,
      `
    export * from 'external';
    import * as ns from 'external2';
    export { a as b } from 'external3';
    export { ns };
  `,
    )
  })

  test('Facade default', async () => {
    await isEqual(
      FILENAME,
      `
      import * as ns from 'external';
      export default ns;
    `,
    )
  })

  test('Facade declaration1', async () => {
    await isEqual(FILENAME, `export function p () {}`)
  })

  test('Facade declaration2', async () => {
    await isEqual(FILENAME, `export var p`)
  })

  test('Facade declaration3', async () => {
    await isEqual(FILENAME, `export {}l`)
  })

  test('Facade declaration4', async () => {
    await isEqual(FILENAME, `export class Q{}`)
  })

  test('Facade side effect', async () => {
    await isEqual(FILENAME, `console.log('any non esm syntax')`)
  })
})

test('Export default', async () => {
  // 🟡  `function functionName = {};` is wrong syntax
  const source = `
    export default async function example   () {};
    export const a = '1';
    export default a;
    export default function example1() {};
    export default function() {};
    export default class className {/* ... */};
    export default class {}
    export default function* generatorFunctionName(){/* ... */};
    export default function* ()  {};
    const async = 1
    export default async

    function x() {}

    const asyncVar = 1
    export default asyncVar

    // function functionName = {};
    export default functionName;
  `
  await isEqual(FILENAME, source)
})

describe('ESM Syntax detection', () => {
  test('hasModuleSyntax import1', async () => {
    const source = 'import foo from "./foo"'
    await isEqual(FILENAME, source)
  })
  test('hasModuleSyntax import2', async () => {
    const source = 'const foo = "import"'
    await isEqual(FILENAME, source)
  })
  test('hasModuleSyntax import3', async () => {
    const source = 'import("./foo")'
    await isEqual(FILENAME, source)
  })
  test('hasModuleSyntax import4', async () => {
    const source = 'import.meta.url'
    await isEqual(FILENAME, source)
  })
  test('hasModuleSyntax export1', async () => {
    const source = 'export const foo = "foo"'
    await isEqual(FILENAME, source)
  })
  test('hasModuleSyntax export2', async () => {
    const source = 'export {}'
    await isEqual(FILENAME, source)
  })
  test('hasModuleSyntax export3', async () => {
    const source = 'export * from "./foo"'
    await isEqual(FILENAME, source)
  })
})

describe('Invalid syntax', () => {
  test('Unterminated object', async () => {
    const source = `
      const foo = };
      const bar = {};
    `
    await expect(async () => {
      await isEqual(FILENAME, source)
    }).rejects.toThrowError()
  })

  test('Invalid string', async () => {
    const source = `import './export.js';

import d from './export.js';

import { s as p } from './reexport1.js';

import { z, q as r } from './reexport2.js';

   '

import * as q from './reexport1.js';

export { d as a, p as b, z as c, r as d, q }`
    await expect(async () => {
      await isEqual(FILENAME, source)
    }).rejects.toThrowError()
  })

  test('Invalid export', async () => {
    const source = `export { a = };`
    await expect(async () => {
      await isEqual(FILENAME, source)
    }).rejects.toThrowError()
  })
})
