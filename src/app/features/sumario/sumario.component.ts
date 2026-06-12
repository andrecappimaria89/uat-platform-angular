import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { TopbarComponent } from '../../shared/components/topbar/topbar.component'

@Component({
  selector: 'app-sumario',
  standalone: true,
  imports: [CommonModule, TopbarComponent],
  template: `
    <div style="display:flex;flex-direction:column;flex:1;overflow-y:auto">
      <app-topbar title="sumario"></app-topbar>
      <div style="padding:24px;color:#888780;font-size:13px">
        <strong>Módulo sumario</strong> — em desenvolvimento.<br><br>
        Implementar seguindo o padrão do ScenariosComponent:<br>
        1. <code>this.store.select(selector)</code> para ler dados<br>
        2. <code>this.store.dispatch(action)</code> para salvar<br>
        3. NgRx Effects persiste automaticamente no Supabase.
      </div>
    </div>
  `,
})
export class SumarioComponent {}
