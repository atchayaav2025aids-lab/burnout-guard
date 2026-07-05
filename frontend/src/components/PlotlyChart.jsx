import React, { useEffect, useRef } from 'react';

export default function PlotlyChart({ chartData, chartId }) {
  const containerRef = useRef(null);

  useEffect(() => {
    // Dynamic CDN injector helper
    const loadPlotlyScript = () => {
      return new Promise((resolve, reject) => {
        if (window.Plotly) {
          resolve(window.Plotly);
          return;
        }

        const script = document.createElement('script');
        script.src = "https://cdn.plot.ly/plotly-2.27.0.min.js";
        script.async = true;
        script.onload = () => resolve(window.Plotly);
        script.onerror = () => reject(new Error("Failed to load Plotly script."));
        document.head.appendChild(script);
      });
    };

    let active = true;

    const draw = (PlotlyInstance) => {
      if (!active || !containerRef.current || !chartData) return;

      const Plotly = PlotlyInstance || window.Plotly;
      if (!Plotly) return;

      // Deep clone layout to prevent sharing mutations across chart instances
      const layout = JSON.parse(JSON.stringify(chartData.layout || {}));
      layout.autosize = true;
      layout.margin = layout.margin || { t: 40, b: 40, l: 40, r: 40 };
      
      const isDark = document.documentElement.classList.contains('theme-dark');
                     
      if (isDark) {
        layout.paper_bgcolor = "rgba(0,0,0,0)";
        layout.plot_bgcolor = "rgba(0,0,0,0)";
        layout.font = { color: "#e2e8f0", size: 10 };
        if (layout.xaxis) {
          layout.xaxis.gridcolor = "#1e293b";
          layout.xaxis.zerolinecolor = "#1e293b";
        }
        if (layout.yaxis) {
          layout.yaxis.gridcolor = "#1e293b";
          layout.yaxis.zerolinecolor = "#1e293b";
        }
      } else {
        layout.paper_bgcolor = "rgba(0,0,0,0)";
        layout.plot_bgcolor = "rgba(0,0,0,0)";
        layout.font = { color: "#334155", size: 10 };
        if (layout.xaxis) {
          layout.xaxis.gridcolor = "#e2e8f0";
          layout.xaxis.zerolinecolor = "#cbd5e1";
        }
        if (layout.yaxis) {
          layout.yaxis.gridcolor = "#e2e8f0";
          layout.yaxis.zerolinecolor = "#cbd5e1";
        }
      }

      Plotly.newPlot(
        containerRef.current, 
        chartData.data || [], 
        layout, 
        { responsive: true, displayModeBar: 'hover' }
      );
    };

    // Load and initial draw
    loadPlotlyScript()
      .then((Plotly) => {
        draw(Plotly);
      })
      .catch((err) => {
        console.error("Plotly load error:", err);
      });

    // MutationObserver to listen to class additions (dark/light toggles) on HTML element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          draw(window.Plotly);
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => {
      active = false;
      observer.disconnect();
    };
  }, [chartData]);

  return (
    <div 
      ref={containerRef} 
      id={chartId} 
      className="w-full h-80 min-h-[320px] transition-all"
    />
  );
}
