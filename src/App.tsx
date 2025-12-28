import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DogProvider } from './context';
import { ModuleSelector } from './components/Home';
import { QuickLogScreen } from './components/Reactivity/QuickLog';
import { SeparationAnxietyScreen } from './components/SeparationAnxiety';
import { MedicationsScreen } from './components/Medications';

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <DogProvider>
        <Routes>
          <Route path="/" element={<ModuleSelector />} />
          <Route path="/reactivity" element={<QuickLogScreen />} />
          <Route path="/separation" element={<SeparationAnxietyScreen />} />
          <Route path="/medications" element={<MedicationsScreen />} />
        </Routes>
      </DogProvider>
    </BrowserRouter>
  );
}

export default App;
