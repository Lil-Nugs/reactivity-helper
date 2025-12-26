import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DogProvider } from './context';
import { ModuleSelector } from './components/Home';
import { QuickLogScreen } from './components/Reactivity/QuickLog';

function App() {
  return (
    <BrowserRouter>
      <DogProvider>
        <Routes>
          <Route path="/" element={<ModuleSelector />} />
          <Route path="/reactivity" element={<QuickLogScreen />} />
          {/* TODO: Add these routes when screens are ready */}
          {/* <Route path="/separation" element={<SeparationAnxietyScreen />} /> */}
          {/* <Route path="/medications" element={<MedicationsScreen />} /> */}
        </Routes>
      </DogProvider>
    </BrowserRouter>
  );
}

export default App;
