const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Test rendering a simple video
async function testRender() {
  try {
    console.log('Testing Remotion render...');
    
    // Create test props
    const props = {
      name: "Test Animation",
      theme: "light",
      aspect: "landscape",
      duration: "5s"
    };
    
    const propsPath = path.join(__dirname, 'test-props.json');
    fs.writeFileSync(propsPath, JSON.stringify(props, null, 2));
    
    // Test output path
    const outputPath = path.join(__dirname, 'test-output.mp4');
    
    // Execute render command
    const command = `npx remotion render src/index.ts NewspaperSpin "${outputPath}" --props="${propsPath}" --duration-in-frames=300`;
    
    console.log('Executing:', command);
    
    exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        console.error('Render error:', error);
        return;
      }
      
      console.log('Render stdout:', stdout);
      if (stderr) {
        console.log('Render stderr:', stderr);
      }
      
      // Check if file was created
      if (fs.existsSync(outputPath)) {
        console.log('✅ Test render successful!');
        console.log('Output file:', outputPath);
        
        // Clean up
        fs.unlinkSync(propsPath);
        fs.unlinkSync(outputPath);
      } else {
        console.log('❌ Test render failed - no output file created');
      }
    });
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testRender();
